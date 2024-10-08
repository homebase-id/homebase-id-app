import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ApiType,
  DotYouClient,
  FailedTransferStatuses,
  HomebaseFile,
  RichText,
} from '@homebase-id/js-lib/core';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { Asset } from 'react-native-image-picker';
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
import { PastedFile } from '@mattermost/react-native-paste-input';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Text } from '../../components/ui/Text/Text';
import { OfflineState } from '../../components/Platform/OfflineState';
import { RetryModal } from '../../components/Chat/Reactions/Modal/RetryModal';
import { getPlainTextFromRichText, t, useDotYouClientContext } from 'homebase-id-app-common';
import { useWebSocketContext } from '../../components/WebSocketContext/useWebSocketContext';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { getImageSize } from '../../utils/utils';
import { openURL } from '../../utils/utils';

export type SelectedMessageState = {
  messageCordinates: { x: number; y: number };
  selectedMessage: ChatMessageIMessage | undefined;
  showChatReactionPopup: boolean;
};

const RENDERED_PAGE_SIZE = 50;
export type ChatProp = NativeStackScreenProps<ChatStackParamList, 'ChatScreen'>;
const ChatPage = memo(({ route, navigation }: ChatProp) => {
  const insets = useSafeAreaInsets();

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
                value.fileMetadata.senderOdinId ||
                value.fileMetadata.originalAuthor ||
                identity ||
                '',
              name:
                value.fileMetadata.senderOdinId ||
                value.fileMetadata.originalAuthor ||
                identity ||
                '',
            },
            sent: value.fileMetadata.appData.content.deliveryStatus === 20,
            received: value.fileMetadata.appData.content.deliveryStatus === 40,
            pending: value.fileMetadata.appData.content.deliveryStatus === 15,
            image:
              value.fileMetadata.payloads?.length > 0
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

  // Conversation & Contact
  const { data: conversation, isLoading: isLoadingConversation } = useConversation({
    conversationId: route.params.convoId,
  }).single;

  const {
    clearChat: { mutate: clearChat, error: clearChatError },
    deleteChat: { mutate: deleteChat, error: deleteChatError },
  } = useConversation();

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
        conversation: conversation as HomebaseFile<UnifiedConversation>,
      });
    },
    [conversation, navigation]
  );

  const {
    mutate: sendMessage,
    status: sendMessageState,
    reset: resetState,
  } = useChatMessage().send;

  useMarkMessagesAsRead({ conversation: conversation || undefined, messages });

  const { mutateAsync: inviteRecipient } = useConversation().inviteRecipient;

  const [linkPreviews, setLinkPreviews] = useState<LinkPreview | null>(null);
  const onDismissLinkPreview = useCallback(() => {
    setLinkPreviews(null);
  }, []);
  const onLinkData = useCallback((link: LinkPreview) => {
    setLinkPreviews(link);
  }, []);

  const doSend = useCallback(
    (message: { text: string | RichText }[], assets?: Asset[]) => {
      if (!conversation) return;

      if (
        !stringGuidsEqual(route.params.convoId, ConversationWithYourselfId) && // You can't invite yourself
        conversation?.fileMetadata.senderOdinId === identity // Only the original creator can invite
      ) {
        const filteredRecipients = conversation.fileMetadata.appData.content.recipients.filter(
          (recipient) => recipient !== identity
        );

        const anyRecipientMissingConversation = filteredRecipients.some((recipient) => {
          const latestTransferStatus =
            conversation.serverMetadata?.transferHistory?.recipients[recipient]
              ?.latestTransferStatus;

          if (!latestTransferStatus) return true;
          return FailedTransferStatuses.includes(latestTransferStatus);
        });
        if (anyRecipientMissingConversation) {
          console.log('invite recipient');
          inviteRecipient({ conversation });
        }
      }

      sendMessage({
        conversation: conversation,
        message: message[0]?.text,
        replyId: replyMessage?.fileMetadata.appData.uniqueId,
        files: assets?.map<ImageSource>((value) => {
          return {
            height: value.height || 0,
            width: value.width || 0,
            name: value.fileName,
            type: value.type && value.type === 'image/jpg' ? 'image/jpeg' : value.type,
            uri: value.uri,
            filename: value.fileName,
            date: Date.parse(value.timestamp || new Date().toUTCString()),
            filepath: value.originalPath,
            id: value.id,
            fileSize: value.fileSize,
          };
        }),
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
    ]
  );

  const onAudioRecord = useCallback(
    (audioPath: string) => {
      const audio: Asset = {
        uri: audioPath,
        type: 'audio/mp3',
        fileName: 'recording',
        fileSize: 0,
        height: 0,
        width: 0,
        originalPath: audioPath,
        timestamp: new Date().toUTCString(),
        id: 'audio',
      };
      doSend([], [audio]);
    },
    [doSend]
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
    if (selectedMessage !== initalSelectedMessageState) {
      setSelectedMessage(initalSelectedMessageState);
    }
  }, [initalSelectedMessageState, selectedMessage]);

  const dismissReaction = useCallback(() => {
    setSelectedMessage(initalSelectedMessageState);
  }, [initalSelectedMessageState]);

  const doReturnToConversations = useCallback(
    () => navigation.navigate('Conversation'),
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
    };
  }, [conversation, doOpenMessageInfo, initalSelectedMessageState, selectedMessage]);

  const handleDialogClose = useCallback(() => {
    setEditDialogVisible(false);
    setDeleteDialogVisible(false);
    setSelectedMessage(initalSelectedMessageState);
  }, [initalSelectedMessageState]);

  const onAssetsAdded = useCallback(
    (assets: ImageSource[]) => {
      if (!conversation) return;
      navigation.navigate('ChatFileOverview', {
        initialAssets: assets,
        recipients: [conversation],
      });
    },
    [conversation, navigation]
  );

  const onPaste = useCallback(
    async (error: string | null | undefined, files: PastedFile[]) => {
      if (error) {
        console.error('Error while pasting:', error);
        return;
      }
      const pastedItems: ImageSource[] = await Promise.all(
        files
          .map(async (file) => {
            if (!file.type.startsWith('image')) return;
            const { width, height } = await getImageSize(file.uri);
            return {
              uri: file.uri,
              type: file.type,
              fileName: file.fileName,
              fileSize: file.fileSize,
              height: height,
              width: width,
            } as ImageSource;
          })
          .filter(Boolean) as Promise<ImageSource>[]
      );
      onAssetsAdded(pastedItems);
    },
    [onAssetsAdded]
  );
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode } = useDarkMode();

  const host = new DotYouClient({
    api: ApiType.Guest,
    identity: identity || undefined,
  }).getRoot();
  const chatOptions: {
    label: string;
    onPress: () => void;
  }[] = useMemo(
    () =>
      [
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
        {
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
      navigation,
      route.params.convoId,
    ]
  );

  if (!conversation) {
    if (isLoadingConversation) return null;
    return <NoConversationHeader title="No conversation found" goBack={doReturnToConversations} />;
  }

  return (
    <BottomSheetModalProvider>
      <ErrorNotification error={clearChatError || deleteChatError} />
      <View
        style={{
          paddingBottom:
            Platform.OS === 'ios' && (replyMessage || Keyboard.isVisible()) ? 0 : insets.bottom,
          flex: 1,
          // Force the height on iOS to better support the keyboard handling
          minHeight: Platform.OS === 'ios' ? Dimensions.get('window').height : undefined,
          backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[50],
        }}
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
                    fileKey: conversation.fileMetadata.payloads?.[0]?.key,
                    previewThumbnail: conversation.fileMetadata.appData.previewThumbnail,
                  }
                : undefined
            }
          />
          {isOpen ? (
            <View
              style={{
                position: 'absolute',
                top: Platform.select({ ios: 90, android: 56 }),
                minWidth: 180,
                right: 4,
                backgroundColor: isDarkMode ? Colors.black : Colors.white,
                zIndex: 20,
                elevation: 20,
                borderWidth: 1,
                borderColor: isDarkMode ? Colors.slate[700] : Colors.gray[200],
                borderRadius: 4,
              }}
            >
              {chatOptions.map((child, index) => (
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
            </View>
          ) : null}
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
                  doSelectMessage={doSelectMessage}
                  doOpenMessageInfo={doOpenMessageInfo}
                  doOpenReactionModal={openReactionModal}
                  doOpenRetryModal={openRetryModal}
                  replyMessage={replyMessage}
                  setReplyMessage={setReplyMessage}
                  onPaste={onPaste}
                  hasMoreMessages={hasMoreMessages}
                  fetchMoreMessages={fetchMoreMessages}
                  conversationId={route.params.convoId}
                  onDismissLinkPreview={onDismissLinkPreview}
                  onLinkData={onLinkData}
                  onAudioRecord={onAudioRecord}
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
      </View>
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
    const { isDarkMode } = useDarkMode();
    const [deleteMessageError, setDeleteMessageError] = useState<unknown | undefined>();
    const identity = useDotYouClientContext().getIdentity();
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
