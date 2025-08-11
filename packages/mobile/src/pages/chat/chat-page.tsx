import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ApiType,
  DotYouClient,
  FailedTransferStatuses,
  HomebaseFile,
  RecipientTransferHistory,
  RichText,
} from '@homebase-id/js-lib/core';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChatAppBar, SelectedMessageProp } from '../../components/Chat/Chat-app-bar';
import {
  ChatDeletedArchivalStaus,
  ChatDeliveryStatus,
  ChatMessage,
} from '../../provider/chat/ChatProvider';
import { useAuth } from '../../hooks/auth/useAuth';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { useConversation } from '../../hooks/chat/useConversation';
import {
  ConversationMetadata,
  ConversationWithYourselfId,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { getNewId, stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import useContact from '../../hooks/contact/useContact';
import { useMarkMessagesAsRead } from '../../hooks/chat/useMarkMessagesAsRead';
import ChatReaction from '../../components/Chat/Chat-Reaction';
import { Host } from 'react-native-portalize';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { EmojiPickerModal } from '../../components/Chat/Reactions/Emoji-Picker/Emoji-Picker-Modal';
import { ReactionsModal } from '../../components/Chat/Reactions/Modal/ReactionsModal';
import { ChatConnectedState } from '../../components/Chat/Chat-Connected-state';
import { ErrorNotification } from '../../components/ui/Alert/ErrorNotification';
import { ChatDetail, ChatMessageIMessage } from '../../components/Chat/ChatDetail';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary/ErrorBoundary';
import { ChatStackParamList } from '../../app/ChatStack';
import { NoConversationHeader } from '../../components/Chat/NoConversationHeader';
import { ChatForwardModal } from '../../components/Chat/Chat-Forward';
import Dialog from 'react-native-dialog';
import { BlurView } from '@react-native-community/blur';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Text } from '../../components/ui/Text/Text';
import { OfflineState } from '../../components/Platform/OfflineState';
import { RetryModal } from '../../components/Chat/Reactions/Modal/RetryModal';
import { getPlainTextFromRichText, t } from 'homebase-id-app-common';
import { useWebSocketContext } from '../../components/WebSocketContext/useWebSocketContext';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { openURL } from '../../utils/utils';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReportModal } from '../../components/Chat/Reactions/Modal/ReportModal';
import { useIntroductions } from '../../hooks/introductions/useIntroductions';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

export type SelectedMessageState = {
  messageCordinates: { x: number; y: number };
  selectedMessage: ChatMessageIMessage | undefined;
  showChatReactionPopup: boolean;
};

const RENDERED_PAGE_SIZE = 50;
export type ChatProp = NativeStackScreenProps<ChatStackParamList, 'ChatScreen'>;
const ChatPage = memo(({ route, navigation }: ChatProp) => {
  const { bottom } = useSafeAreaInsets();

  const [replyMessage, setReplyMessage] = useState<ChatMessageIMessage | null>(null);
  const identity = useAuth().getIdentity();

  const { isOnline } = useWebSocketContext();

  const initialString = route.params.initialText;

  // Messages
  const [loadedPages, setLoadedPages] = useState(1);
  const {
    all: {
      data: chatMessages,
      hasNextPage: hasMoreMessagesOnServer,
      fetchNextPage: fetchMoreMessagesFromServer,
    },
  } = useChatMessages({
    conversationId: route.params.convoId,
  });

  const messages: ChatMessageIMessage[] = useMemo(
    () =>
      (
        chatMessages?.pages
          .flatMap((page) => page.searchResults)
          ?.filter(Boolean) as HomebaseFile<ChatMessage>[]
      )
        ?.reduce((acc, cur) => {
          // This is to avoid any duplicates as a last resort; It should never happen that the cache has duplicates.. Keyword: "should"
          const existing = acc.find((existing) =>
            stringGuidsEqual(
              existing.fileMetadata.appData.uniqueId,
              cur.fileMetadata.appData.uniqueId
            )
          );

          if (existing) {
            console.warn('Duplicate message found', existing, cur);
            return acc;
          }
          acc.push(cur);

          return acc;
        }, [] as HomebaseFile<ChatMessage>[])
        ?.map<ChatMessageIMessage>((value) => {
          // Mapping done here, because the chat component expects a different format
          return {
            // Prefer uniqueId to avoid duplicates between onMutate and actual data
            _id: value.fileMetadata.appData.uniqueId || value.fileId || getNewId(),
            createdAt: value.fileMetadata.created,
            text:
              value.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus
                ? 'This message was deleted.'
                : value.fileMetadata.appData.content.message,
            user: {
              _id:
                value.fileMetadata.originalAuthor ||
                value.fileMetadata.senderOdinId ||
                identity ||
                '',
              name:
                value.fileMetadata.originalAuthor ||
                value.fileMetadata.senderOdinId ||
                identity ||
                '',
            },
            sent: value.fileMetadata.appData.content.deliveryStatus === 20,
            received: value.fileMetadata.appData.content.deliveryStatus === 40,
            pending: value.fileMetadata.appData.content.deliveryStatus === 15,
            image:
              value.fileMetadata.payloads && value.fileMetadata.payloads?.length > 0
                ? value.fileMetadata.payloads.length.toString()
                : undefined,
            ...value,
          };
        }) || [],
    [chatMessages, identity]
  );

  const hasMoreMessages = useMemo(() => {
    if (messages.length > loadedPages * RENDERED_PAGE_SIZE) {
      return true;
    }

    return hasMoreMessagesOnServer;
  }, [hasMoreMessagesOnServer, loadedPages, messages.length]);

  const fetchMoreMessages = useCallback(() => {
    if (messages.length > loadedPages * RENDERED_PAGE_SIZE) {
      setLoadedPages((prev) => prev + 1);
      return;
    }

    if (hasMoreMessagesOnServer) {
      fetchMoreMessagesFromServer();
      setLoadedPages((prev) => prev + 1);
    }
  }, [fetchMoreMessagesFromServer, hasMoreMessagesOnServer, loadedPages, messages.length]);

  const slicedMessages = useMemo(
    () => messages.slice(0, loadedPages * RENDERED_PAGE_SIZE),
    [loadedPages, messages]
  );

  const {
    single: { data: conversation, isLoading: isLoadingConversation },
    clearChat: { mutate: clearChat, error: clearChatError },
    deleteChat: { mutate: deleteChat, error: deleteChatError },
    inviteRecipient: { mutateAsync: inviteRecipient },
    update: { mutate: updateArchivalStatus },
  } = useConversation({
    conversationId: route.params.convoId,
  });

  const filteredRecipients = conversation?.fileMetadata.appData.content.recipients.filter(
    (recipient) => recipient !== identity
  );
  const contact = useContact(filteredRecipients?.length === 1 ? filteredRecipients[0] : undefined)
    .fetch.data;

  const title = useMemo(
    () =>
      contact?.fileMetadata.appData.content.name?.displayName ||
      contact?.fileMetadata.appData.content.name?.surname ||
      (filteredRecipients?.length === 1 ? filteredRecipients[0] : undefined) ||
      conversation?.fileMetadata.appData.content.title,
    [filteredRecipients, contact, conversation]
  );

  const isGroupChat =
    (
      conversation?.fileMetadata.appData.content?.recipients?.filter(
        (recipient) => recipient !== identity
      ) || []
    )?.length > 1;

  const initalSelectedMessageState: SelectedMessageState = useMemo(
    () => ({
      messageCordinates: { x: 0, y: 0 },
      selectedMessage: undefined,
      showChatReactionPopup: false,
    }),
    []
  );
  const [selectedMessage, setSelectedMessage] = useState<SelectedMessageState>(
    initalSelectedMessageState
  );

  const doSelectMessage = useCallback(
    ({ coords, message }: { coords: { x: number; y: number }; message: ChatMessageIMessage }) => {
      if (message && message.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus) {
        return;
      }
      setSelectedMessage({
        messageCordinates: coords,
        selectedMessage: message,
        showChatReactionPopup: true,
      });
    },
    []
  );

  const doOpenMessageInfo = useCallback(
    (message: ChatMessageIMessage) => {
      navigation.navigate('MessageInfo', {
        message,
        conversation: conversation as HomebaseFile<UnifiedConversation, ConversationMetadata>,
      });
    },
    [conversation, navigation]
  );

  const {
    mutate: sendMessage,
    status: sendMessageState,
    reset: resetState,
  } = useChatMessage().send;
  const { mutate: introduceIdentities } = useIntroductions().introduceIdentities;

  useMarkMessagesAsRead({ conversation: conversation || undefined, messages });

  const [linkPreviews, setLinkPreviews] = useState<LinkPreview | null>(null);
  const onDismissLinkPreview = useCallback(() => {
    setLinkPreviews(null);
  }, []);
  const onLinkData = useCallback((link: LinkPreview) => {
    setLinkPreviews(link);
  }, []);

  const doSend = useCallback(
    (message: { text: string | RichText }[], assets?: ImageSource[]) => {
      const firstOfSeptember2024 = new Date('2024-08-01').getTime();

      if (!conversation) return;

      if (
        !stringGuidsEqual(route.params.convoId, ConversationWithYourselfId) && // You can't invite yourself
        conversation?.fileMetadata.senderOdinId === identity && // Only the original creator can invite
        conversation?.fileMetadata.created >= firstOfSeptember2024 // Only conversations created after September 2024 (new format)
      ) {
        const filteredRecipients = conversation.fileMetadata.appData.content.recipients.filter(
          (recipient) => recipient !== identity
        );

        const anyRecipientMissingConversation = (() => {
          if (
            conversation.serverMetadata?.transferHistory &&
            'recipients' in conversation.serverMetadata.transferHistory
          ) {
            return filteredRecipients.some((recipient) => {
              const latestTransferStatus = (
                conversation.serverMetadata as unknown as {
                  transferHistory: {
                    recipients: {
                      [key: string]: RecipientTransferHistory;
                    };
                  };
                }
              ).transferHistory.recipients[recipient]?.latestTransferStatus;

              if (!latestTransferStatus) return true;
              return FailedTransferStatuses.includes(latestTransferStatus);
            });
          }

          return (
            conversation.serverMetadata?.originalRecipientCount !==
            conversation.serverMetadata?.transferHistory?.summary.totalDelivered
          );
        })();

        if (anyRecipientMissingConversation) {
          console.log('invite recipient');
          inviteRecipient({ conversation });
          if (filteredRecipients.length > 1) {
            // Group chat; Good to introduce everyone
            introduceIdentities({
              message: t('{0} has added you to a group chat', identity || ''),
              recipients: filteredRecipients,
            });
          }
        }
      }

      sendMessage({
        conversation: conversation,
        message: message[0]?.text,
        replyId: replyMessage?.fileMetadata.appData.uniqueId,
        files: assets,
        linkPreviews: linkPreviews ? [linkPreviews] : [],
        chatId: getNewId(),
        userDate: new Date().getTime(),
      });
      setLinkPreviews(null);
      setReplyMessage(null);
    },
    [
      conversation,
      route.params.convoId,
      sendMessage,
      replyMessage?.fileMetadata.appData.uniqueId,
      linkPreviews,
      identity,
      inviteRecipient,
      introduceIdentities,
    ]
  );

  useEffect(() => {
    if (sendMessageState === 'pending') resetState();
  }, [
    conversation,
    inviteRecipient,
    messages.length,
    sendMessageState,
    resetState,
    doSend,
    route.params.convoId,
  ]);

  // ref
  const emojiPickerSheetModalRef = useRef<BottomSheetModal>(null);
  const reactionModalRef = useRef<BottomSheetModal>(null);
  const forwardModalRef = useRef<BottomSheetModal>(null);
  const reportModalRef = useRef<BottomSheetModal>(null);
  const retryModelRef = useRef<BottomSheetModal>(null);

  const openEmojiModal = useCallback(() => {
    emojiPickerSheetModalRef.current?.present();
    setSelectedMessage({ ...selectedMessage, showChatReactionPopup: false });
  }, [selectedMessage]);

  const [selectedReactionMessage, setSelectedReactionMessage] = useState<ChatMessageIMessage>();
  const [selectedRetryMessage, setSelectedRetryMessage] = useState<ChatMessageIMessage>();

  const openReactionModal = useCallback((message: ChatMessageIMessage) => {
    setSelectedReactionMessage(message);
    reactionModalRef.current?.present();
  }, []);

  const openRetryModal = useCallback((message: ChatMessageIMessage) => {
    const deliveryStatus = message.fileMetadata.appData.content.deliveryStatus;

    if (deliveryStatus === ChatDeliveryStatus.Failed) {
      setSelectedRetryMessage(message);
      retryModelRef.current?.present();
    }
  }, []);

  const dismissSelectedMessage = useCallback(() => {
    emojiPickerSheetModalRef.current?.dismiss();
    reactionModalRef.current?.dismiss();
    forwardModalRef.current?.dismiss();
    retryModelRef.current?.dismiss();
    reportModalRef.current?.dismiss();
    if (selectedMessage !== initalSelectedMessageState) {
      setSelectedMessage(initalSelectedMessageState);
    }
  }, [initalSelectedMessageState, selectedMessage]);

  const dismissReaction = useCallback(() => {
    setSelectedMessage(initalSelectedMessageState);
  }, [initalSelectedMessageState]);

  const doReturnToConversations = useCallback(
    () => navigation.navigate('Conversation', undefined, { pop: true }),
    [navigation]
  );

  const [editDialogVisible, setEditDialogVisible] = useState<boolean>(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState<boolean>(false);

  const selectedMessageActions: SelectedMessageProp = useMemo(() => {
    return {
      onCopy: () => {
        if (selectedMessage) {
          const message = selectedMessage.selectedMessage?.text;
          if (message) {
            Clipboard.setString(getPlainTextFromRichText(message));
            Toast.show({
              text1: 'Copied to Clipboard',
              type: 'success',
              visibilityTime: 2000,
              position: 'bottom',
            });
          }
          setSelectedMessage(initalSelectedMessageState);
        }
      },
      onDelete: () => {
        if (selectedMessage?.selectedMessage && conversation) {
          // console.log(
          //   'Delete Message',
          //   selectedMessage.selectedMessage?.fileMetadata.appData.archivalStatus
          // );
          setDeleteDialogVisible(true);
          setSelectedMessage({ ...selectedMessage, showChatReactionPopup: false });
        }
      },
      onReply: () => {
        if (selectedMessage?.selectedMessage) {
          setReplyMessage(selectedMessage.selectedMessage);
          setSelectedMessage(initalSelectedMessageState);
        }
      },
      onInfo: () => {
        if (selectedMessage?.selectedMessage) {
          doOpenMessageInfo(selectedMessage.selectedMessage);
          setSelectedMessage(initalSelectedMessageState);
        }
      },
      onForward: () => {
        setSelectedMessage({ ...selectedMessage, showChatReactionPopup: false });
        forwardModalRef.current?.present();
      },
      onEdit: () => {
        setEditDialogVisible(true);
        setSelectedMessage({ ...selectedMessage, showChatReactionPopup: false });
      },
      onReport: () => {
        setSelectedMessage({ ...selectedMessage, showChatReactionPopup: false });
        reportModalRef.current?.present();
      },
    };
  }, [conversation, doOpenMessageInfo, initalSelectedMessageState, selectedMessage]);

  const handleDialogClose = useCallback(() => {
    setEditDialogVisible(false);
    setDeleteDialogVisible(false);
    setSelectedMessage(initalSelectedMessageState);
  }, [initalSelectedMessageState]);

  const onAssetsAdded = useCallback(
    (assets: ImageSource[]) => {
      if (!conversation || !assets.length) return;
      if (assets.length === 1 && assets[0].type?.startsWith('audio')) {
        doSend([], assets);
        return;
      }
      navigation.navigate('ChatFileOverview', {
        initialAssets: assets,
        recipients: [conversation],
        title: title,
      });
    },
    [conversation, doSend, navigation, title]
  );

  // const onPaste = useCallback(
  //   async (error: string | null | undefined, files: PastedFile[]) => {
  //     if (error) {
  //       console.error('Error while pasting:', error);
  //       return;
  //     }
  //     const pastedItems: ImageSource[] = await Promise.all(
  //       files
  //         .map(async (file) => {
  //           if (!file.type.startsWith('image')) return;
  //           const { width, height } = await getImageSize(file.uri);
  //           return {
  //             uri: file.uri,
  //             type: file.type,
  //             fileName: file.fileName,
  //             fileSize: file.fileSize,
  //             height: height,
  //             width: width,
  //           } as ImageSource;
  //         })
  //         .filter(Boolean) as Promise<ImageSource>[]
  //     );
  //     onAssetsAdded(pastedItems);
  //   },
  //   [onAssetsAdded]
  // );
  const [isOpen, setIsOpen] = useState(false);
  const menuAnim = useSharedValue(0);

  useEffect(() => {
    menuAnim.value = withTiming(isOpen ? 1 : 0, { duration: isOpen ? 180 : 120 });
  }, [isOpen, menuAnim]);

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuAnim.value,
    transform: [
      {
        translateY: menuAnim.value === 0 ? -30 : withTiming(0, { duration: 180 }),
      },
    ],
  }));
  const { isDarkMode } = useDarkMode();

  const host = identity
    ? new DotYouClient({
        api: ApiType.Guest,
        hostIdentity: identity,
      }).getRoot()
    : '';
  const chatOptions: {
    label: string;
    onPress: () => void;
  }[] = useMemo(
    () =>
      [
        {
          label:
            conversation?.fileMetadata.appData.archivalStatus === 3
              ? 'Unarchive Chat'
              : 'Archive Chat',
          onPress: () => {
            if (!conversation) return;
            const archivalStatus = conversation.fileMetadata.appData.archivalStatus;
            updateArchivalStatus({
              distribute: false,
              conversation: {
                ...conversation,
                fileMetadata: {
                  ...conversation.fileMetadata,
                  appData: {
                    ...conversation.fileMetadata.appData,
                    archivalStatus: archivalStatus === 3 ? 0 : 3,
                  },
                },
              },
            });
            if ([0, undefined].includes(archivalStatus)) navigation.navigate('Conversation');

            Toast.show({
              type: 'success',
              text1: `Chat ${archivalStatus === 3 ? 'unarchived' : 'archived'}`,
              position: 'bottom',
            });
          },
        },
        {
          label: 'Clear Chat',
          onPress: () => {
            if (!conversation) return;
            Alert.alert(
              'Clear Chat',
              "Are you sure you want to clear the chat history? You won't be able to recover them later",
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    clearChat({
                      conversation: conversation,
                    });
                  },
                },
              ]
            );
          },
        },
        route.params.convoId !== ConversationWithYourselfId
          ? {
              label: 'Delete',
              onPress: () => {
                if (!conversation) return;
                Alert.alert(
                  'Delete Chat',
                  "Are you sure you want to delete this chat? You won't be able to recover them later",
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        deleteChat({
                          conversation: conversation,
                        });
                        navigation.navigate('Conversation');
                      },
                    },
                  ]
                );
              },
            }
          : undefined,
        {
          label: `${t('Report')}`,
          onPress: async () => {
            //TODO: Update to use the report endpoint
            openURL('https://ravenhosting.cloud/report/content');
          },
        },
        isGroupChat
          ? undefined
          : {
              label: `${t('Block this user')}`,
              onPress: () => {
                openURL(`${host}/owner/connections/${filteredRecipients?.[0]}/block`);
              },
            },
      ].filter(Boolean) as {
        label: string;
        onPress: () => void;
      }[],

    [
      clearChat,
      conversation,
      deleteChat,
      filteredRecipients,
      host,
      isGroupChat,
      navigation,
      route.params.convoId,
      updateArchivalStatus,
    ]
  );

  const { progress } = useReanimatedKeyboardAnimation();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: progress.value === 0 ? 8 : bottom,
    };
  }, []);

  if (!conversation) {
    if (isLoadingConversation) return null;
    return <NoConversationHeader title="No conversation found" goBack={doReturnToConversations} />;
  }

  console.log(bottom, 'bottom');

  return (
    <BottomSheetModalProvider>
      <GestureHandlerRootView>
        <ErrorNotification error={clearChatError || deleteChatError} />
        <Animated.View
          style={[
            {
              // paddingBottom:
              //   Platform.OS === 'ios' && (replyMessage || Keyboard.isVisible()) ? 0 : bottom,
              flex: 1,
              // Force the height on iOS to better support the keyboard handling
              minHeight: Platform.OS === 'ios' ? Dimensions.get('window').height : undefined,
              backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[50],
            },
            animatedStyle,
          ]}
        >
          <ErrorBoundary>
            <ChatAppBar
              title={title || ''}
              group={!!isGroupChat}
              odinId={
                stringGuidsEqual(route.params.convoId, ConversationWithYourselfId)
                  ? identity || ''
                  : (filteredRecipients?.length === 1 && filteredRecipients[0]) || ''
              }
              goBack={
                selectedMessage.selectedMessage ? dismissSelectedMessage : doReturnToConversations
              }
              onPress={() => navigation.navigate('ChatInfo', { convoId: route.params.convoId })}
              onMorePress={() => setIsOpen(!isOpen)}
              isSelf={stringGuidsEqual(route.params.convoId, ConversationWithYourselfId)}
              selectedMessage={selectedMessage?.selectedMessage}
              selectedMessageActions={selectedMessageActions}
              groupAvatarProp={
                isGroupChat
                  ? {
                      fileId: conversation.fileId,
                      fileKey: conversation.fileMetadata.payloads?.[0]?.key as string,
                      previewThumbnail: conversation.fileMetadata.appData.previewThumbnail,
                    }
                  : undefined
              }
            />
            <Animated.View
              pointerEvents={isOpen ? 'auto' : 'none'}
              style={[
                {
                  position: 'absolute',
                  // Even more vertical offset for more separation from the app bar
                  top: Platform.select({ ios: 80, android: 95 }),
                  minWidth: 180,
                  right: 4,
                  backgroundColor: isDarkMode ? Colors.black : Colors.white,
                  zIndex: 20,
                  elevation: 20,
                  borderWidth: 1,
                  borderColor: isDarkMode ? Colors.slate[700] : Colors.gray[200],
                  borderRadius: 4,
                },
                menuAnimatedStyle,
              ]}
            >
              {isOpen &&
                chatOptions.map((child, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setIsOpen(false);
                      child.onPress();
                    }}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: isDarkMode ? Colors.black : Colors.white,
                      flexDirection: 'row',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <Text>{child.label}</Text>
                  </TouchableOpacity>
                ))}
            </Animated.View>
            <ChatConnectedState {...conversation} />
            <OfflineState isConnected={isOnline} />
            <Host>
              <Pressable
                onPress={dismissSelectedMessage}
                disabled={selectedMessage.selectedMessage === undefined}
                style={{ flex: 1 }}
              >
                <ErrorBoundary>
                  <ChatDetail
                    initialMessage={initialString}
                    isGroup={!!isGroupChat}
                    messages={slicedMessages}
                    doSend={doSend}
                    selectedMessage={selectedMessage.selectedMessage}
                    doSelectMessage={doSelectMessage}
                    doOpenMessageInfo={doOpenMessageInfo}
                    doOpenReactionModal={openReactionModal}
                    doOpenRetryModal={openRetryModal}
                    replyMessage={replyMessage}
                    setReplyMessage={setReplyMessage}
                    hasMoreMessages={hasMoreMessages}
                    fetchMoreMessages={fetchMoreMessages}
                    conversationId={route.params.convoId}
                    onDismissLinkPreview={onDismissLinkPreview}
                    onLinkData={onLinkData}
                    onAssetsAdded={onAssetsAdded}
                  />
                </ErrorBoundary>
              </Pressable>

              <ChatReaction
                selectedMessage={selectedMessage}
                afterSendReaction={dismissReaction}
                openEmojiPicker={openEmojiModal}
              />
            </Host>
          </ErrorBoundary>
        </Animated.View>
        <EmojiPickerModal
          ref={emojiPickerSheetModalRef}
          selectedMessage={selectedMessage.selectedMessage}
          onDismiss={dismissSelectedMessage}
        />
        <ReactionsModal
          ref={reactionModalRef}
          message={selectedReactionMessage}
          onClose={() => {
            setSelectedReactionMessage(undefined);
          }}
        />
        <ChatForwardModal
          ref={forwardModalRef}
          onClose={dismissSelectedMessage}
          selectedMessage={selectedMessage.selectedMessage}
        />
        <RetryModal
          ref={retryModelRef}
          message={selectedRetryMessage}
          conversation={conversation}
          onClose={() => {
            retryModelRef.current?.dismiss();
            setSelectedRetryMessage(undefined);
          }}
        />
        <ReportModal
          ref={reportModalRef}
          message={selectedMessage.selectedMessage}
          onClose={dismissSelectedMessage}
        />

        <EditDialogBox
          visible={editDialogVisible}
          handleDialogClose={handleDialogClose}
          selectedMessage={selectedMessage.selectedMessage}
        />
        <DeleteDialogBox
          visible={deleteDialogVisible}
          handleDialogClose={handleDialogClose}
          selectedMessage={selectedMessage.selectedMessage}
        />
      </GestureHandlerRootView>
    </BottomSheetModalProvider>
  );
});

type EditDialogBoxProp = {
  visible: boolean;
  selectedMessage?: ChatMessageIMessage;
  handleDialogClose: () => void;
};

type DeleteDialogBoxProp = {
  visible: boolean;
  selectedMessage?: ChatMessageIMessage;
  handleDialogClose: () => void;
};

const EditDialogBox = memo(({ visible, handleDialogClose, selectedMessage }: EditDialogBoxProp) => {
  const { mutate: updateMessage, error } = useChatMessage().update;
  const { isDarkMode } = useDarkMode();

  const { data: conversation } = useConversation({
    conversationId: selectedMessage?.fileMetadata.appData.groupId,
  }).single;
  const [value, setValue] = useState<string | RichText | undefined>();

  useLayoutEffect(() => {
    if (selectedMessage) {
      setValue(selectedMessage.fileMetadata.appData.content.message);
    }
  }, [selectedMessage]);

  const handleEditMessage = useCallback(() => {
    if (!value || !selectedMessage || !conversation) {
      return;
    }
    const updatedChatMessage: HomebaseFile<ChatMessage> = {
      ...selectedMessage,
      fileMetadata: {
        ...selectedMessage?.fileMetadata,
        appData: {
          ...selectedMessage?.fileMetadata.appData,
          content: {
            ...selectedMessage?.fileMetadata.appData.content,
            message: value,
          },
        },
      },
    };
    updateMessage({
      updatedChatMessage: updatedChatMessage,
      conversation,
    });
    handleDialogClose();
  }, [conversation, handleDialogClose, selectedMessage, updateMessage, value]);
  const blurComponentIOS = (
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType={isDarkMode ? 'dark' : 'light'}
      blurAmount={50}
    />
  );
  return (
    <>
      <ErrorNotification error={error} />
      <Dialog.Container
        useNativeDriver
        visible={visible}
        blurComponentIOS={blurComponentIOS}
        onBackdropPress={handleDialogClose}
        contentStyle={{
          borderRadius: 15,
          backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[200],
        }}
      >
        <Dialog.Title>Edit Message</Dialog.Title>
        <Dialog.Input
          value={value ? getPlainTextFromRichText(value) : undefined}
          onChangeText={(text) => {
            setValue(text);
          }}
          autoFocus
        />
        <Dialog.Button label="Cancel" onPress={handleDialogClose} />
        <Dialog.Button label="Save" onPress={handleEditMessage} />
      </Dialog.Container>
    </>
  );
});

const DeleteDialogBox = memo(
  ({ visible, handleDialogClose, selectedMessage }: DeleteDialogBoxProp) => {
    const identity = useAuth().getIdentity();
    const { isDarkMode } = useDarkMode();
    const [deleteMessageError, setDeleteMessageError] = useState<unknown | undefined>();
    const { data: conversation } = useConversation({
      conversationId: selectedMessage?.fileMetadata.appData.groupId,
    }).single;

    const {
      delete: { mutateAsync: deleteMessage },
    } = useChatMessages({ conversationId: conversation?.fileMetadata.appData.uniqueId });

    // Show this option when the message is sent by you and the conversation is not with yourself
    const showDeleteForEveryone =
      (!selectedMessage?.fileMetadata.senderOdinId ||
        selectedMessage?.fileMetadata.senderOdinId === identity) &&
      !stringGuidsEqual(conversation?.fileMetadata.appData.uniqueId, ConversationWithYourselfId);

    const onDelete = async (deleteForEveryone: boolean) => {
      if (!selectedMessage || !conversation) {
        return;
      }
      try {
        await deleteMessage({
          conversation: conversation,
          messages: [selectedMessage],
          deleteForEveryone: deleteForEveryone,
        });

        handleDialogClose();
      } catch (ex) {
        setDeleteMessageError(ex);
      }
    };

    const blurComponentIOS = (
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDarkMode ? 'dark' : 'light'}
        blurAmount={50}
      />
    );
    return (
      <>
        <ErrorNotification error={deleteMessageError} />
        <Dialog.Container
          useNativeDriver
          visible={visible}
          blurComponentIOS={blurComponentIOS}
          onBackdropPress={handleDialogClose}
          verticalButtons
          contentStyle={{
            borderRadius: 15,
            backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[200],
          }}
        >
          <Dialog.Title>{t('Delete Message')}?</Dialog.Title>
          <Dialog.Description>
            {t('Are you sure you want to delete this message')}?
          </Dialog.Description>
          <Dialog.Button
            label={t('Delete for Me')}
            color={Colors.red[500]}
            onPress={() => onDelete(false)}
          />
          {showDeleteForEveryone && (
            <Dialog.Button
              label={t('Delete for Everyone')}
              color={Colors.red[500]}
              onPress={() => onDelete(true)}
            />
          )}

          <Dialog.Button label="Cancel" onPress={handleDialogClose} />
        </Dialog.Container>
      </>
    );
  }
);

export default ChatPage;
