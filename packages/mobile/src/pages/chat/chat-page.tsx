import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, Image, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ChatAppBar, SelectedMessageProp } from '../../components/Chat/Chat-app-bar';
import { Asset } from 'react-native-image-picker';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useAuth } from '../../hooks/auth/useAuth';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { useConversation } from '../../hooks/chat/useConversation';
import {
  ConversationWithYourselfId,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { getNewId, stringGuidsEqual } from '@youfoundation/js-lib/helpers';
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

export type SelectedMessageState = {
  messageCordinates: { x: number; y: number };
  selectedMessage: ChatMessageIMessage | undefined;
  showChatReactionPopup: boolean;
};

export type ChatProp = NativeStackScreenProps<ChatStackParamList, 'ChatScreen'>;
const ChatPage = memo(({ route, navigation }: ChatProp) => {
  const insets = useSafeAreaInsets();

  const [replyMessage, setReplyMessage] = useState<ChatMessageIMessage | null>(null);
  const identity = useAuth().getIdentity();

  const [assets, setAssets] = useState<Asset[]>([]);
  // Messages
  const {
    all: { data: chatMessages, hasNextPage: hasMoreMessages, fetchNextPage: fetchMoreMessages },
    delete: { mutate: deleteMessage, error: deleteMessageError },
  } = useChatMessages({
    conversationId: route.params.convoId,
  });

  const messages: ChatMessageIMessage[] = useMemo(
    () =>
      (
        chatMessages?.pages
          .flatMap((page) => page.searchResults)
          ?.filter(Boolean) as HomebaseFile<ChatMessage>[]
      )?.map<ChatMessageIMessage>((value) => {
        // Mapping done here, because the chat component expects a different format
        return {
          _id: value.fileId || value.fileMetadata.appData.uniqueId || getNewId(),
          createdAt: value.fileMetadata.created,
          text:
            value.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus
              ? 'This message was deleted.'
              : value.fileMetadata.appData.content.message,
          user: {
            _id: value.fileMetadata.senderOdinId || identity || '',
            name: value.fileMetadata.senderOdinId || identity || '',
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

  // Conversation & Contact
  const { data: conversation, isLoading: isLoadingConversation } = useConversation({
    conversationId: route.params.convoId,
  }).single;

  const filteredRecipients = conversation?.fileMetadata.appData.content.recipients.filter(
    (recipient) => recipient !== identity
  );
  const contact = useContact(filteredRecipients?.length === 1 ? filteredRecipients[0] : undefined)
    .fetch.data;

  const title = useMemo(
    () =>
      contact?.fileMetadata.appData.content.name?.displayName ||
      contact?.fileMetadata.appData.content.name?.surname ||
      conversation?.fileMetadata.appData.content.title,
    [contact, conversation]
  );

  const isGroupChat =
    (
      conversation?.fileMetadata.appData.content?.recipients?.filter(
        (recipient) => recipient !== identity
      ) || []
    )?.length > 1;

  // const [messageCordinates, setMessageCordinates] = useState({ x: 0, y: 0 });

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
    error: sendMessageError,
  } = useChatMessage().send;

  useMarkMessagesAsRead({ conversation: conversation || undefined, messages });

  const { mutateAsync: inviteRecipient } = useConversation().inviteRecipient;
  const doSend = useCallback(
    (message: ChatMessageIMessage[]) => {
      if (!conversation) return;
      // If the chat was empty, invite the recipient
      if (
        messages?.filter((msg) => msg.fileId).length === 0 &&
        conversation &&
        !stringGuidsEqual(route.params.convoId, ConversationWithYourselfId)
      ) {
        inviteRecipient({
          conversation: conversation,
        });
      }

      sendMessage({
        conversation: conversation,
        message: message[0]?.text,
        replyId: replyMessage?.fileMetadata.appData.uniqueId,
        files: assets.map<ImageSource>((value) => {
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
      });
      setAssets([]);
      setReplyMessage(null);
    },
    [
      messages,
      conversation,
      route.params.convoId,
      sendMessage,
      replyMessage?.fileMetadata.appData.uniqueId,
      assets,
      inviteRecipient,
    ]
  );

  useEffect(() => {
    // Send Audio after Recording
    if (assets.length === 1 && assets[0].type?.startsWith('audio/')) {
      doSend([]);
    }
    if (sendMessageState === 'pending') resetState();
  }, [
    conversation,
    inviteRecipient,
    messages.length,
    sendMessageState,
    resetState,
    assets,
    doSend,
    route.params.convoId,
  ]);

  // ref
  const emojiPickerSheetModalRef = useRef<BottomSheetModal>(null);
  const reactionModalRef = useRef<BottomSheetModal>(null);
  const forwardModalRef = useRef<BottomSheetModal>(null);

  const openEmojiModal = useCallback(() => {
    emojiPickerSheetModalRef.current?.present();
    setSelectedMessage({ ...selectedMessage, showChatReactionPopup: false });
  }, [selectedMessage]);

  const [selectedReactionMessage, setSelectedReactionMessage] = useState<ChatMessageIMessage>();

  const openReactionModal = useCallback((message: ChatMessageIMessage) => {
    setSelectedReactionMessage(message);
    reactionModalRef.current?.present();
  }, []);

  const dismissSelectedMessage = useCallback(() => {
    emojiPickerSheetModalRef.current?.dismiss();
    reactionModalRef.current?.dismiss();
    forwardModalRef.current?.dismiss();
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

  const [dialogVisible, setDialogVisible] = useState<boolean>(false);

  const selectedMessageActions: SelectedMessageProp = useMemo(() => {
    return {
      onCopy: () => {
        if (selectedMessage) {
          const message = selectedMessage.selectedMessage?.text;
          if (message) {
            Clipboard.setString(message);
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
          deleteMessage({
            conversation: conversation,
            messages: [selectedMessage.selectedMessage],
            deleteForEveryone: true,
          });
          setSelectedMessage(initalSelectedMessageState);
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
        setDialogVisible(true);
        setSelectedMessage({ ...selectedMessage, showChatReactionPopup: false });
      },
    };
  }, [conversation, deleteMessage, doOpenMessageInfo, initalSelectedMessageState, selectedMessage]);

  const handleDialogClose = useCallback(() => {
    setDialogVisible(false);
    setSelectedMessage(initalSelectedMessageState);
  }, [initalSelectedMessageState]);

  const onPaste = useCallback(async (error: string | null | undefined, files: PastedFile[]) => {
    if (error) {
      console.error('Error while pasting:', error);
      return;
    }
    const pastedItems: Asset[] = await Promise.all(
      files
        .map(async (file) => {
          if (!file.type.startsWith('image')) return {};
          const { width, height } = await new Promise<{
            width: number;
            height: number;
          }>((resolve) => Image.getSize(file.uri, (width, height) => resolve({ width, height })));
          return {
            uri: file.uri,
            type: file.type,
            fileName: file.fileName,
            fileSize: file.fileSize,
            height: height,
            width: width,
          };
        })
        .filter((value) => Object.keys(value).length > 0)
    );
    setAssets((old) => [...old, ...pastedItems]);
  }, []);

  if (!conversation) {
    if (isLoadingConversation) return null;
    return <NoConversationHeader title="No conversation found" goBack={navigation.goBack} />;
  }

  return (
    <BottomSheetModalProvider>
      <ErrorNotification error={sendMessageError || deleteMessageError} />
      <View
        style={{
          paddingBottom:
            Platform.OS === 'ios' && (replyMessage || Keyboard.isVisible()) ? 0 : insets.bottom,
          flex: 1,
          // Force the height on iOS to better support the keyboard handling
          minHeight: Platform.OS === 'ios' ? Dimensions.get('window').height : undefined,
        }}
      >
        <ErrorBoundary>
          <ChatAppBar
            title={title || ''}
            group={!!isGroupChat}
            odinId={
              route.params.convoId === ConversationWithYourselfId
                ? identity || ''
                : (filteredRecipients?.length === 1 && filteredRecipients[0]) || ''
            }
            goBack={
              selectedMessage.selectedMessage ? dismissSelectedMessage : doReturnToConversations
            }
            onPress={() => navigation.navigate('ChatInfo', { convoId: route.params.convoId })}
            isSelf={route.params.convoId === ConversationWithYourselfId}
            selectedMessage={selectedMessage?.selectedMessage}
            selectedMessageActions={selectedMessageActions}
          />
          <ChatConnectedState {...conversation} />
          <Host>
            <Pressable
              onPress={dismissSelectedMessage}
              disabled={selectedMessage.selectedMessage === undefined}
              style={{ flex: 1 }}
            >
              <ErrorBoundary>
                <ChatDetail
                  isGroup={!!isGroupChat}
                  messages={messages}
                  doSend={doSend}
                  doSelectMessage={doSelectMessage}
                  doOpenMessageInfo={doOpenMessageInfo}
                  doOpenReactionModal={openReactionModal}
                  replyMessage={replyMessage}
                  setReplyMessage={setReplyMessage}
                  assets={assets}
                  onPaste={onPaste}
                  setAssets={setAssets}
                  hasMoreMessages={hasMoreMessages}
                  fetchMoreMessages={fetchMoreMessages}
                  conversationId={route.params.convoId}
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
        selectedMessage={selectedMessage.selectedMessage as ChatMessageIMessage}
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

      <EditDialogBox
        visible={dialogVisible}
        handleDialogClose={handleDialogClose}
        selectedMessage={selectedMessage.selectedMessage}
      />
    </BottomSheetModalProvider>
  );
});

type DialogBoxProp = {
  visible: boolean;
  selectedMessage?: ChatMessageIMessage;
  handleDialogClose: () => void;
};

const EditDialogBox = memo(({ visible, handleDialogClose, selectedMessage }: DialogBoxProp) => {
  const { mutate: updateMessage, error } = useChatMessage().update;
  const { data: conversation } = useConversation({
    conversationId: selectedMessage?.fileMetadata.appData.groupId,
  }).single;
  const [value, setValue] = useState<string | undefined>();

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
    <BlurView style={StyleSheet.absoluteFill} blurType="xlight" blurAmount={50} />
  );
  return (
    <>
      <ErrorNotification error={error} />
      <Dialog.Container
        visible={visible}
        blurComponentIOS={blurComponentIOS}
        onBackdropPress={handleDialogClose}
      >
        <Dialog.Title>Edit Message</Dialog.Title>
        <Dialog.Input
          value={value}
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

export default ChatPage;
