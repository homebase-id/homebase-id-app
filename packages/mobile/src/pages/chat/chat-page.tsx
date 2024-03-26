import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppStackParamList } from '../../app/App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Keyboard, View } from 'react-native';
import { ChatAppBar } from '../../components/Chat/Chat-app-bar';
import { Asset } from 'react-native-image-picker';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { useAuth } from '../../hooks/auth/useAuth';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { useConversation } from '../../hooks/chat/useConversation';
import {
  Conversation,
  ConversationWithYourself,
  ConversationWithYourselfId,
  GroupConversation,
  SingleConversation,
} from '../../provider/chat/ConversationProvider';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { getNewId, stringGuidsEqual } from '@youfoundation/js-lib/helpers';
import useContact from '../../hooks/contact/useContact';
import { useMarkMessagesAsRead } from '../../hooks/chat/useMarkMessagesAsRead';
import PortalView, { HighlightedChatMessage } from '../../components/Chat/Chat-Reaction';
import { Host } from 'react-native-portalize';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { EmojiPickerModal } from '../../components/Chat/Reactions/Emoji-Picker/Emoji-Picker-Modal';
import { ReactionsModal } from '../../components/Chat/Reactions/Modal/ReactionsModal';
import { ChatConnectedState } from '../../components/Chat/Chat-Connected-state';
import { ErrorNotification } from '../../components/ui/Alert/ErrorNotification';
import { ChatDetail, ChatMessageIMessage } from '../../components/Chat/ChatDetail';

export type ChatProp = NativeStackScreenProps<AppStackParamList, 'ChatScreen'>;

const ChatPage = ({ route, navigation }: ChatProp) => {
  const insets = useSafeAreaInsets();

  const [replyMessage, setReplyMessage] = useState<ChatMessageIMessage | null>(null);
  const identity = useAuth().getIdentity();

  const [assets, setAssets] = useState<Asset[]>([]);
  // Messages
  const { data: chatMessages } = useChatMessages({
    conversationId: route.params.convoId,
  }).all;

  const messages: ChatMessageIMessage[] = useMemo(
    () =>
      (
        chatMessages?.pages
          .flatMap((page) => page.searchResults)
          ?.filter(Boolean) as HomebaseFile<ChatMessage>[]
      )?.map<ChatMessageIMessage>((value) => {
        // Mapping done here, because the chat component expects a different format
        return {
          _id: value.fileMetadata.appData.uniqueId ?? value.fileId ?? getNewId(),
          createdAt: value.fileMetadata.created,
          text: value.fileMetadata.appData.content.message,
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
  let { data: conversationContent } = useConversation({
    conversationId: route.params.convoId,
  }).single;
  const contact = useContact(
    (conversationContent?.fileMetadata.appData.content as SingleConversation | undefined)?.recipient
  ).fetch.data;

  const { mutateAsync: inviteRecipient } = useConversation().inviteRecipient;

  const title = useMemo(
    () =>
      contact?.fileMetadata.appData.content.name?.displayName ||
      contact?.fileMetadata.appData.content.name?.surname ||
      conversationContent?.fileMetadata.appData.content.title,
    [contact, conversationContent]
  );

  if (
    conversationContent == null &&
    stringGuidsEqual(route.params.convoId, ConversationWithYourselfId)
  ) {
    conversationContent = ConversationWithYourself;
  }
  const isGroup =
    conversationContent && 'recipients' in conversationContent.fileMetadata.appData.content;

  const [messageCordinates, setMessageCordinates] = useState({ x: 0, y: 0 });
  const [selectedMessage, setSelectedMessage] = useState<HighlightedChatMessage | undefined>();

  const doSelectMessage = useCallback(
    ({
      coords,
      message,
    }: {
      coords: { x: number; y: number };
      message: HighlightedChatMessage;
    }) => {
      setMessageCordinates(coords);
      setSelectedMessage(message);
    },
    []
  );

  const doOpenMessageInfo = useCallback(
    (message: ChatMessageIMessage) => {
      navigation.navigate('MessageInfo', {
        message,
        conversation: conversationContent as HomebaseFile<Conversation>,
      });
    },
    [conversationContent, navigation]
  );

  const {
    mutate: sendMessage,
    status: sendMessageState,
    reset: resetState,
    error: sendMessageError,
  } = useChatMessage().send;

  useEffect(() => {
    if (messages.length === 0 && conversationContent) {
      inviteRecipient({
        conversation: conversationContent,
      });
    }
    if (sendMessageState === 'pending') resetState();
  }, [conversationContent, inviteRecipient, messages.length, sendMessageState, resetState]);

  useMarkMessagesAsRead({ conversation: conversationContent || undefined, messages });

  const doSend = useCallback(
    (message: ChatMessageIMessage[]) => {
      sendMessage({
        conversationId: route.params.convoId,
        message: message[0].text,
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
        recipients:
          (conversationContent?.fileMetadata.appData.content as GroupConversation).recipients ||
          [
            (conversationContent?.fileMetadata.appData.content as SingleConversation).recipient,
          ].filter(Boolean),
      });
      setAssets([]);
      setReplyMessage(null);
    },
    [conversationContent, route.params.convoId, sendMessage, assets, replyMessage]
  );

  // ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const reactionModalRef = useRef<BottomSheetModal>(null);

  const openEmojiModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const [selectedReactionMessage, setSelectedReactionMessage] = useState<ChatMessageIMessage>();

  const openReactionModal = useCallback((message: ChatMessageIMessage) => {
    setSelectedReactionMessage(message);
    reactionModalRef.current?.present();
  }, []);

  if (!conversationContent) return null;

  return (
    <BottomSheetModalProvider>
      <Host>
        <ErrorNotification error={sendMessageError} />
        <View
          style={{
            paddingBottom: insets.bottom,
            flex: 1,
          }}
        >
          <ChatAppBar
            title={title || ''}
            group={'recipients' in conversationContent.fileMetadata.appData.content}
            odinId={
              route.params.convoId === ConversationWithYourselfId
                ? identity || ''
                : (conversationContent?.fileMetadata.appData.content as SingleConversation)
                    .recipient
            }
            goBack={navigation.goBack}
            onPress={() => navigation.navigate('ChatInfo', { convoId: route.params.convoId })}
            isSelf={route.params.convoId === ConversationWithYourselfId}
          />
          <ChatConnectedState {...conversationContent} />
          <ChatDetail
            isGroup={!!isGroup}
            messages={messages}
            doSend={doSend}
            doSelectMessage={doSelectMessage}
            doOpenMessageInfo={doOpenMessageInfo}
            doOpenReactionModal={openReactionModal}
            replyMessage={replyMessage}
            setReplyMessage={setReplyMessage}
            assets={assets}
            setAssets={setAssets}
          />
          <PortalView
            messageCordinates={messageCordinates}
            selectedMessage={selectedMessage}
            setSelectedMessage={setSelectedMessage}
            openEmojiPicker={openEmojiModal}
          />
        </View>
      </Host>
      <EmojiPickerModal
        ref={bottomSheetModalRef}
        selectedMessage={selectedMessage as ChatMessageIMessage}
      />
      <ReactionsModal
        ref={reactionModalRef}
        message={selectedReactionMessage}
        onClose={() => {
          setSelectedReactionMessage(undefined);
          reactionModalRef.current?.dismiss();
        }}
      />
    </BottomSheetModalProvider>
  );
};

export default ChatPage;
