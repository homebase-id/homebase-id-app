import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppStackParamList } from '../../app/App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Keyboard, Platform, Pressable, View } from 'react-native';
import { ChatAppBar } from '../../components/Chat/Chat-app-bar';
import { Asset } from 'react-native-image-picker';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useAuth } from '../../hooks/auth/useAuth';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { useConversation } from '../../hooks/chat/useConversation';
import {
  Conversation,
  ConversationWithYourselfId,
  GroupConversation,
  SingleConversation,
} from '../../provider/chat/ConversationProvider';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { getNewId } from '@youfoundation/js-lib/helpers';
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

export type ChatProp = NativeStackScreenProps<AppStackParamList, 'ChatScreen'>;

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
          _id: value.fileMetadata.appData.uniqueId ?? value.fileId ?? getNewId(),
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
  const { data: conversation } = useConversation({
    conversationId: route.params.convoId,
  }).single;
  const contact = useContact(
    (conversation?.fileMetadata.appData.content as SingleConversation | undefined)?.recipient
  ).fetch.data;

  const title = useMemo(
    () =>
      contact?.fileMetadata.appData.content.name?.displayName ||
      contact?.fileMetadata.appData.content.name?.surname ||
      conversation?.fileMetadata.appData.content.title,
    [contact, conversation]
  );

  const isGroup = conversation && 'recipients' in conversation.fileMetadata.appData.content;

  const [messageCordinates, setMessageCordinates] = useState({ x: 0, y: 0 });
  const [selectedMessage, setSelectedMessage] = useState<ChatMessageIMessage | undefined>();

  const doSelectMessage = useCallback(
    ({ coords, message }: { coords: { x: number; y: number }; message: ChatMessageIMessage }) => {
      setMessageCordinates(coords);
      setSelectedMessage(message);
      setshowChatReactionPopup(true);
    },
    []
  );

  const doOpenMessageInfo = useCallback(
    (message: ChatMessageIMessage) => {
      navigation.navigate('MessageInfo', {
        message,
        conversation: conversation as HomebaseFile<Conversation>,
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
      // If the chat was empty, invite the recipient
      if (messages.length === 0 && conversation && route.params.convoId !== ConversationWithYourselfId) {
        inviteRecipient({
          conversation: conversation,
        });
      }

      sendMessage({
        conversationId: route.params.convoId,
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
        recipients:
          (conversation?.fileMetadata.appData.content as GroupConversation).recipients ||
          [(conversation?.fileMetadata.appData.content as SingleConversation).recipient].filter(
            Boolean
          ),
      });
      setAssets([]);
      setReplyMessage(null);
    },
    [messages.length, conversation, route.params.convoId, sendMessage, replyMessage?.fileMetadata.appData.uniqueId, assets, inviteRecipient]
  );

  useEffect(() => {
    // Send Audio after Recording
    if (assets.length === 1 && assets[0].type?.startsWith('audio/')) {
      doSend([]);
    }
    if (sendMessageState === 'pending') resetState();
  }, [conversation, inviteRecipient, messages.length, sendMessageState, resetState, assets, doSend, route.params.convoId]);

  // ref
  const emojiPickerSheetModalRef = useRef<BottomSheetModal>(null);
  const reactionModalRef = useRef<BottomSheetModal>(null);

  const openEmojiModal = useCallback(() => {
    emojiPickerSheetModalRef.current?.present();
    setshowChatReactionPopup(false);
  }, []);

  const [selectedReactionMessage, setSelectedReactionMessage] = useState<ChatMessageIMessage>();
  const [showChatReactionPopup, setshowChatReactionPopup] = useState(true);

  const openReactionModal = useCallback((message: ChatMessageIMessage) => {
    setSelectedReactionMessage(message);
    reactionModalRef.current?.present();
  }, []);

  if (!conversation) return null;

  return (
    <BottomSheetModalProvider>
      <ErrorNotification error={sendMessageError || deleteMessageError} />
      <View
        style={{
          paddingBottom:
            Platform.OS === 'ios' && (replyMessage || Keyboard.isVisible()) ? 0 : insets.bottom,
          flex: 1,
        }}
      >
        <ErrorBoundary>
          <ChatAppBar
            title={title || ''}
            group={'recipients' in conversation.fileMetadata.appData.content}
            odinId={
              route.params.convoId === ConversationWithYourselfId
                ? identity || ''
                : (conversation?.fileMetadata.appData.content as SingleConversation).recipient
            }
            goBack={navigation.goBack}
            onPress={() => navigation.navigate('ChatInfo', { convoId: route.params.convoId })}
            isSelf={route.params.convoId === ConversationWithYourselfId}
            selectedMessage={selectedMessage}
            selectedMessageActions={{
              onCopy: () => {
                if (selectedMessage) {
                  const message = selectedMessage.text;
                  if (message) {
                    Clipboard.setString(message);
                    Toast.show({
                      text1: 'Copied to Clipboard',
                      type: 'success',
                      visibilityTime: 2000,
                      position: 'bottom',
                    });
                  }
                  setSelectedMessage(undefined);
                }
              },
              onDelete: () => {
                if (selectedMessage && conversation) {
                  console.log(
                    'Delete Message',
                    selectedMessage.fileMetadata.appData.archivalStatus
                  );
                  deleteMessage({
                    conversation: conversation,
                    messages: [selectedMessage],
                    deleteForEveryone: true,
                  });
                  setSelectedMessage(undefined);
                }
              },
              onReply: () => {
                if (selectedMessage) {
                  setReplyMessage(selectedMessage);
                  setSelectedMessage(undefined);
                }
              },
              onInfo: () => {
                if (selectedMessage) {
                  doOpenMessageInfo(selectedMessage);
                  setSelectedMessage(undefined);
                }
              },
            }}
          />
          <ChatConnectedState {...conversation} />
          <Host>
            <Pressable
              onPress={() => {
                emojiPickerSheetModalRef.current?.dismiss();
                reactionModalRef.current?.dismiss();
                setSelectedMessage(undefined);
              }}
              disabled={selectedMessage === undefined}
              style={{ flex: 1 }}
            >
              <ErrorBoundary>
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
                  hasMoreMessages={hasMoreMessages}
                  fetchMoreMessages={fetchMoreMessages}
                />
              </ErrorBoundary>
            </Pressable>

            <ChatReaction
              messageCordinates={messageCordinates}
              selectedMessage={selectedMessage}
              setSelectedMessage={setSelectedMessage}
              openEmojiPicker={openEmojiModal}
              showReaction={showChatReactionPopup}
            />
          </Host>
        </ErrorBoundary>
      </View>
      <EmojiPickerModal
        ref={emojiPickerSheetModalRef}
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
});

export default ChatPage;
