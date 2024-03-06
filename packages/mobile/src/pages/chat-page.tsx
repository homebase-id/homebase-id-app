import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Actions,
  Bubble,
  BubbleProps,
  Composer,
  GiftedChat,
  IMessage,
  InputToolbar,
  InputToolbarProps,
  MessageProps,
  MessageText,
  Send,
  Time,
} from 'react-native-gifted-chat';
import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatStackParamList } from '../app/App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ImageBackground,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChatAppBar } from '../components/ui/Chat/Chat-app-bar';
import { Close, Images, SendChat } from '../components/ui/Icons/icons';
import ImageMessage from '../components/ui/Chat/ImageMessage';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { ChatMessage } from '../provider/chat/ChatProvider';
import { useAuth } from '../hooks/auth/useAuth';
import { useChatMessages } from '../hooks/chat/useChatMessages';
import { useChatMessage } from '../hooks/chat/useChatMessage';
import { useConversation } from '../hooks/chat/useConversation';
import {
  ChatDrive,
  ConversationWithYourself,
  ConversationWithYourselfId,
  GroupConversation,
  SingleConversation,
} from '../provider/chat/ConversationProvider';
import { ImageSource } from '../provider/image/RNImageProvider';
import { getNewId } from '@youfoundation/js-lib/helpers';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../app/Colors';
import ReplyMessageBar from '../components/ui/Chat/Reply-Message-bar';
import ChatMessageBox from '../components/ui/Chat/Chat-Message-box';
import { OdinImage } from '../components/ui/OdinImage/OdinImage';
import { useDarkMode } from '../hooks/useDarkMode';
import useContact from '../hooks/contact/useContact';
import { useMarkMessagesAsRead } from '../hooks/chat/useMarkMessagesAsRead';
import { ChatDeliveryIndicator } from '../components/ui/Chat/Chat-Delivery-Indicator';

export type ChatProp = NativeStackScreenProps<ChatStackParamList, 'ChatScreen'>;

export interface ChatMessageIMessage extends IMessage, DriveSearchResult<ChatMessage> {}

const ChatPage = ({ route, navigation }: ChatProp) => {
  const [replyMessage, setReplyMessage] = useState<ChatMessageIMessage | null>(null);
  const swipeableRowRef = useRef<Swipeable | null>(null);
  const clearReplyMessage = () => setReplyMessage(null);
  const identity = useAuth().getIdentity();
  const { data: chatMessages } = useChatMessages({
    conversationId: route.params.convoId,
  }).all;
  const [assets, setAssets] = useState<Asset[]>([]);

  let { data: conversationContent } = useConversation({
    conversationId: route.params.convoId,
  }).single;

  const { mutateAsync: inviteRecipient } = useConversation().inviteRecipient;

  const contact = useContact(
    (conversationContent?.fileMetadata.appData.content as SingleConversation | undefined)?.recipient
  ).fetch.data;
  const title =
    contact?.fileMetadata.appData.content.name?.displayName ||
    contact?.fileMetadata.appData.content.name?.surname ||
    conversationContent?.fileMetadata.appData.content.title;

  if (conversationContent == null) {
    conversationContent = ConversationWithYourself;
  }

  const renderCustomInputToolbar = (props: InputToolbarProps<IMessage>) => {
    return (
      <>
        <InputToolbar
          {...props}
          renderAccessory={(props) =>
            replyMessage ? (
              <ReplyMessageBar message={replyMessage} clearReply={clearReplyMessage} {...props} />
            ) : null
          }
          renderComposer={(props) => (
            <Composer
              {...props}
              textInputStyle={{
                color: isDarkMode ? 'white' : 'black',
              }}
            />
          )}
          renderSend={(props) => (
            <Send
              {...props}
              disabled={!props.text && assets?.length === 0}
              text={props.text || ' '}
              containerStyle={styles.send}
            >
              <SendChat size={'md'} color={!props.text && assets?.length === 0 ? 'grey' : 'blue'} />
            </Send>
          )}
          renderActions={() => (
            <Actions
              icon={PickImage}
              onPressActionButton={async () => {
                const medias = await launchImageLibrary({
                  mediaType: 'mixed',
                  selectionLimit: 10,
                });
                if (medias.didCancel) return;
                setAssets(medias.assets ?? []);
              }}
            />
          )}
          containerStyle={[
            styles.inputContainer,
            {
              backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[100],
              borderTopWidth: 0,
              borderRadius: 10,
            },
          ]}
        />
      </>
    );
  };

  const updateRowRef = useCallback(
    (ref: any) => {
      if (
        ref &&
        replyMessage &&
        ref.props.children.props.currentMessage?._id === replyMessage._id
      ) {
        swipeableRowRef.current = ref;
      }
    },
    [replyMessage]
  );

  const renderMessageBox = (props: MessageProps<ChatMessageIMessage>) => (
    <ChatMessageBox {...props} setReplyOnSwipeOpen={setReplyMessage} updateRowRef={updateRowRef} />
  );

  const renderMediaItems = () => {
    return (
      <View
        key={'ftr_key'}
        style={{
          flexDirection: 'row',
        }}
      >
        {assets.map((value, index) => {
          const isVideo = value.type?.startsWith('video') ?? false;
          return (
            <View
              key={index}
              style={{
                borderRadius: 15,
              }}
            >
              <ImageBackground
                key={index}
                source={{ uri: value.uri || value.originalPath }}
                style={{
                  width: 70,
                  height: 60,
                  alignItems: 'flex-end',
                  paddingRight: 2,
                  paddingTop: 2,
                  marginRight: 4,
                }}
              >
                <TouchableOpacity onPress={() => setAssets(assets.filter((_, i) => i !== index))}>
                  <Close size={'sm'} color="white" />
                </TouchableOpacity>
              </ImageBackground>
            </View>
          );
        })}
      </View>
    );
  };

  const messages: ChatMessageIMessage[] = useMemo(
    () =>
      (
        chatMessages?.pages
          .flatMap((page) => page.searchResults)
          ?.filter(Boolean) as DriveSearchResult<ChatMessage>[]
      )?.map<ChatMessageIMessage>((value) => {
        // Mapping done here, because the chat component expects a different format
        return {
          _id: value.fileMetadata.appData.uniqueId ?? value.fileId ?? getNewId(),
          createdAt: value.fileMetadata.created,
          text: value.fileMetadata.appData.content.message,
          user: {
            _id: value.fileMetadata.senderOdinId || '',
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
    if (replyMessage && swipeableRowRef.current) {
      swipeableRowRef.current.close();
      swipeableRowRef.current = null;
    }
    if (sendMessageState === 'pending') resetState();
  }, [
    replyMessage,
    conversationContent,
    inviteRecipient,
    messages.length,
    sendMessageState,
    resetState,
  ]);

  useMarkMessagesAsRead({ conversation: conversationContent, messages });

  const doSend = useCallback(
    (message: IMessage[]) => {
      console.log('Sending message', message);
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

  const { isDarkMode } = useDarkMode();
  const insets = useSafeAreaInsets();
  if (!conversationContent) return null;
  if (sendMessageError) console.error(sendMessageError);

  return (
    <View
      style={{
        paddingBottom: replyMessage && !Keyboard.isVisible() ? insets.bottom : 0,
        flex: 1,
      }}
    >
      <ChatAppBar
        title={title || ''}
        group={'recipients' in conversationContent.fileMetadata.appData.content}
        odinId={
          route.params.convoId === ConversationWithYourselfId
            ? identity || ''
            : (conversationContent?.fileMetadata.appData.content as SingleConversation).recipient
        }
        goBack={navigation.goBack}
        onPress={() => navigation.navigate('ChatInfo', { convoId: route.params.convoId })}
        isSelf={route.params.convoId === ConversationWithYourselfId}
      />
      <GiftedChat<ChatMessageIMessage>
        messages={messages}
        onSend={doSend}
        renderAvatar={null}
        infiniteScroll
        scrollToBottom
        alwaysShowSend
        isKeyboardInternallyHandled={true}
        keyboardShouldPersistTaps="never"
        renderMessageImage={(prop) => <ImageMessage {...prop} />}
        renderCustomView={(prop: BubbleProps<ChatMessageIMessage>) => (
          <RenderReplyMessageView {...prop} />
        )}
        renderBubble={(props) => {
          const message = props.currentMessage as ChatMessageIMessage;
          const content = message?.fileMetadata.appData.content;
          const isEmojiOnly =
            (content?.message?.match(/^\p{Extended_Pictographic}/u) &&
              !content.message?.match(/[0-9a-zA-Z]/)) ??
            false;
          const isReply = !!content?.replyId;
          const showBackground = !isEmojiOnly || isReply;
          return (
            <Bubble
              {...props}
              renderTicks={(message) => {
                const msg = message as ChatMessageIMessage;
                return <ChatDeliveryIndicator msg={msg} />;
              }}
              renderTime={(props) => {
                return (
                  <Time
                    {...props}
                    timeTextStyle={
                      !showBackground
                        ? {
                            left: {
                              color: isDarkMode ? Colors.white : Colors.black,
                              fontSize: 12,
                            },
                            right: {
                              color: isDarkMode ? Colors.white : Colors.black,
                              fontSize: 12,
                            },
                          }
                        : {
                            right: {
                              fontSize: 12,
                              color: !isDarkMode ? Colors.slate[600] : Colors.slate[200],
                            },
                            left: {
                              fontSize: 12,
                            },
                          }
                    }
                  />
                );
              }}
              tickStyle={{
                color: isDarkMode ? Colors.white : Colors.black,
              }}
              textStyle={
                showBackground
                  ? {
                      left: { color: isDarkMode ? Colors.white : Colors.black },
                      right: { color: isDarkMode ? Colors.white : Colors.black },
                    }
                  : {}
              }
              wrapperStyle={
                !showBackground
                  ? {
                      left: {
                        backgroundColor: 'transparent',
                      },
                      right: {
                        backgroundColor: 'transparent',
                      },
                    }
                  : {
                      left: {
                        backgroundColor: isDarkMode
                          ? `${Colors.gray[300]}4D`
                          : `${Colors.gray[500]}1A`,
                      },
                      right: {
                        backgroundColor: isDarkMode
                          ? `${Colors.indigo[500]}33`
                          : `${Colors.indigo[500]}1A`,
                      },
                    }
              }
            />
          );
        }}
        renderMessageText={(props) => {
          const message = props.currentMessage as ChatMessageIMessage;
          const content = message?.fileMetadata.appData.content;
          const isEmojiOnly =
            (content?.message?.match(/^\p{Extended_Pictographic}/u) &&
              !content.message?.match(/[0-9a-zA-Z]/)) ??
            false;
          return (
            <MessageText
              {...props}
              linkStyle={{
                left: {
                  color: Colors.indigo[500],
                },
                right: {
                  color: Colors.indigo[500],
                },
              }}
              customTextStyle={
                isEmojiOnly
                  ? {
                      fontSize: 48,
                      lineHeight: 60,
                    }
                  : undefined
              }
            />
          );
        }}
        renderMessage={renderMessageBox}
        renderFooter={renderMediaItems}
        renderAccessory={() => null}
        renderInputToolbar={renderCustomInputToolbar}
        user={{
          _id: '',
        }}
      />
    </View>
  );
};

const RenderReplyMessageView = (props: BubbleProps<ChatMessageIMessage>) => {
  const replyMessage = useChatMessage({
    messageId: props.currentMessage?.fileMetadata.appData.content.replyId,
  }).get.data;
  return (
    props.currentMessage &&
    props.currentMessage.fileMetadata.appData.content.replyId && (
      <View
        style={[
          styles.replyMessageContainer,
          {
            borderLeftColor: props.position === 'left' ? Colors.blue[500] : Colors.purple[500],
            backgroundColor: `${Colors.indigo[500]}1A`,
          },
        ]}
      >
        <View style={styles.replyText}>
          <Text
            style={{
              fontWeight: '600',
              fontSize: 15,
            }}
          >
            {props.currentMessage?.fileMetadata.senderOdinId?.length > 0
              ? props.currentMessage.fileMetadata.senderOdinId
              : 'You'}
          </Text>
          <Text
            style={{
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {replyMessage?.fileMetadata.appData.content.message}
          </Text>
        </View>
        {replyMessage && replyMessage.fileMetadata.payloads?.length > 0 && (
          <OdinImage
            fileId={replyMessage.fileId}
            targetDrive={ChatDrive}
            fileKey={replyMessage.fileMetadata.payloads[0].key}
            imageSize={{
              width: 60,
              height: 60,
            }}
          />
        )}
      </View>
    )
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    flexDirection: 'column-reverse',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  replyText: {
    justifyContent: 'center',
    marginLeft: 6,
    marginRight: 12,
  },
  replyMessageContainer: {
    padding: 8,
    paddingBottom: 8,
    display: 'flex',
    flexDirection: 'row',
    borderLeftWidth: 6,
    borderLeftColor: 'lightgrey',
    borderRadius: 6,
    marginLeft: 6,
    marginTop: 6,
    marginRight: 6,
  },

  send: {
    borderWidth: 0,
    justifyContent: 'center',
    marginRight: 8,
    transform: [{ rotate: '30deg' }],
  },
});

const PickImage = () => {
  return <Images />;
};

export default ChatPage;
