import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Actions,
  Avatar,
  AvatarProps,
  Bubble,
  BubbleProps,
  Composer,
  GiftedChat,
  IMessage,
  InputToolbar,
  InputToolbarProps,
  MessageImageProps,
  MessageProps,
  MessageText,
  MessageTextProps,
  Send,
  Time,
} from 'react-native-gifted-chat';
import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { AppStackParamList } from '../../app/App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GestureResponderEvent,
  ImageBackground,
  Keyboard,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChatAppBar } from '../../components/ui/Chat/Chat-app-bar';
import { Close, Images, SendChat } from '../../components/ui/Icons/icons';
import ImageMessage from '../../components/ui/Chat/ImageMessage';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { useAuth } from '../../hooks/auth/useAuth';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { useConversation } from '../../hooks/chat/useConversation';
import {
  ChatDrive,
  Conversation,
  ConversationWithYourself,
  ConversationWithYourselfId,
  GroupConversation,
  SingleConversation,
} from '../../provider/chat/ConversationProvider';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { getNewId, stringGuidsEqual } from '@youfoundation/js-lib/helpers';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../../app/Colors';
import ReplyMessageBar from '../../components/ui/Chat/Reply-Message-bar';
import ChatMessageBox from '../../components/ui/Chat/Chat-Message-box';
import { OdinImage } from '../../components/ui/OdinImage/OdinImage';
import { useDarkMode } from '../../hooks/useDarkMode';
import useContact from '../../hooks/contact/useContact';
import { useMarkMessagesAsRead } from '../../hooks/chat/useMarkMessagesAsRead';
import { ChatDeliveryIndicator } from '../../components/ui/Chat/Chat-Delivery-Indicator';
import Toast from 'react-native-toast-message';
import PortalView from '../../components/ui/Chat/Chat-Reaction';
import { Host } from 'react-native-portalize';
import { useChatReaction } from '../../hooks/chat/useChatReaction';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { EmojiPickerModal } from '../../components/ui/Emoji-Picker/Emoji-Picker-Modal';
import { ReactionsModal } from '../../components/ui/Modal/ReactionsModal';
import { Avatar as AppAvatar, OwnerAvatar } from '../../components/ui/Chat/Conversation-tile';
import { ChatConnectedState } from '../../components/ui/Chat/Chat-Connected-state';
import { ConnectionName } from '../../components/ui/Name';

export type ChatProp = NativeStackScreenProps<AppStackParamList, 'ChatScreen'>;

export interface ChatMessageIMessage extends IMessage, DriveSearchResult<ChatMessage> {}

const ChatPage = ({ route, navigation }: ChatProp) => {
  const { isDarkMode } = useDarkMode();
  const insets = useSafeAreaInsets();

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

  const renderCustomInputToolbar = useCallback(
    (props: InputToolbarProps<IMessage>) => {
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
                <SendChat
                  size={'md'}
                  color={!props.text && assets?.length === 0 ? 'grey' : 'blue'}
                />
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
    },
    [assets?.length, isDarkMode, replyMessage]
  );

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

  const [layoutHeight, setLayoutHeight] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    setLayoutHeight(height);
  };

  const [messageCordinates, setMessageCordinates] = useState({ x: 0, y: 0 });
  const [selectedMessage, setSelectedMessage] = useState<ChatMessageIMessage | undefined>();

  const onLongPress = useCallback(
    (e: GestureResponderEvent, message: ChatMessageIMessage) => {
      const { pageY, locationY } = e.nativeEvent;
      const y = pageY - locationY;

      setMessageCordinates({
        x: 0,
        y,
      });

      setSelectedMessage({ layoutHeight, ...message });
    },
    [layoutHeight]
  );

  const onLeftSwipe = useCallback(
    (message: ChatMessageIMessage) => {
      navigation.navigate('MessageInfo', {
        message,
        conversation: conversationContent as DriveSearchResult<Conversation>,
      });
    },
    [conversationContent, navigation]
  );

  const renderMessageBox = useCallback(
    (props: MessageProps<ChatMessageIMessage>) => {
      return (
        <ChatMessageBox
          {...props}
          setReplyOnSwipeOpen={setReplyMessage}
          updateRowRef={updateRowRef}
          onMessageLayout={onLayout}
          onLeftSwipeOpen={onLeftSwipe}
        />
      );
    },
    [onLeftSwipe, updateRowRef]
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
          // const isVideo = value.type?.startsWith('video') ?? false;
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

  useMarkMessagesAsRead({ conversation: conversationContent || undefined, messages });

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

  const renderMessageText = useCallback((props: MessageTextProps<IMessage>) => {
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
  }, []);

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
  if (sendMessageError) {
    Toast.show({
      type: 'error',
      text1: 'Error sending message',
      text2: sendMessageError.message,
      position: 'bottom',
    });
    console.error(sendMessageError);
  }

  const isGroup = 'recipients' in conversationContent.fileMetadata.appData.content;

  return (
    <BottomSheetModalProvider>
      <Host>
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
                : (conversationContent?.fileMetadata.appData.content as SingleConversation)
                    .recipient
            }
            goBack={navigation.goBack}
            onPress={() => navigation.navigate('ChatInfo', { convoId: route.params.convoId })}
            isSelf={route.params.convoId === ConversationWithYourselfId}
          />
          <ChatConnectedState {...conversationContent} />
          <GiftedChat<ChatMessageIMessage>
            messages={messages}
            onSend={doSend}
            infiniteScroll
            scrollToBottom
            onLongPress={(e, _, m: ChatMessageIMessage) => onLongPress(e, m)}
            alwaysShowSend
            isKeyboardInternallyHandled={true}
            keyboardShouldPersistTaps="never"
            renderMessageImage={(prop: MessageImageProps<ChatMessageIMessage>) => (
              <ImageMessage {...prop} />
            )}
            renderCustomView={(prop: BubbleProps<ChatMessageIMessage>) => (
              <RenderReplyMessageView {...prop} />
            )}
            renderBubble={(prop) => <RenderBubble {...prop} onReactionClick={openReactionModal} />}
            renderMessageText={renderMessageText}
            renderMessage={renderMessageBox}
            renderFooter={renderMediaItems}
            renderAccessory={() => null}
            showUserAvatar={false}
            renderUsernameOnMessage={isGroup}
            renderAvatar={
              !isGroup
                ? null
                : (props: AvatarProps<IMessage>) => {
                    const prop = props as AvatarProps<ChatMessageIMessage>;
                    const odinId = prop.currentMessage?.fileMetadata.senderOdinId;

                    if (!odinId) {
                      return (
                        <Avatar
                          renderAvatar={(
                            _: Omit<AvatarProps<ChatMessageIMessage>, 'renderAvatar'>
                          ) => {
                            return (
                              <OwnerAvatar
                                style={{
                                  width: 30,
                                  height: 30,
                                  marginRight: 0,
                                }}
                              />
                            );
                          }}
                        />
                      );
                    }
                    return (
                      <Avatar
                        renderAvatar={(
                          _: Omit<AvatarProps<ChatMessageIMessage>, 'renderAvatar'>
                        ) => {
                          return (
                            <AppAvatar
                              odinId={odinId}
                              style={{
                                width: 30,
                                height: 30,
                                marginRight: 0,
                              }}
                            />
                          );
                        }}
                      />
                    );
                  }
            }
            renderInputToolbar={renderCustomInputToolbar}
            user={{
              _id: identity || '',
            }}
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

const RenderBubble = memo(
  (
    props: {
      onReactionClick: (message: ChatMessageIMessage) => void;
    } & Readonly<BubbleProps<IMessage>>
  ) => {
    const message = props.currentMessage as ChatMessageIMessage;
    const content = message?.fileMetadata.appData.content;
    const { isDarkMode } = useDarkMode();
    const isEmojiOnly =
      (content?.message?.match(/^\p{Extended_Pictographic}/u) &&
        !content.message?.match(/[0-9a-zA-Z]/)) ??
      false;
    const isReply = !!content?.replyId;
    const showBackground = !isEmojiOnly || isReply;
    const { data: reactions } = useChatReaction({
      conversationId: message?.fileMetadata.appData.groupId,
      messageId: message?.fileMetadata.appData.uniqueId,
    }).get;

    const hasReactions = (reactions && reactions?.length > 0) || false;
    const flatReactions = reactions?.flatMap((val) => val.fileMetadata.appData.content.message);
    return (
      <>
        <Bubble
          {...props}
          renderTicks={(message: ChatMessageIMessage) => <ChatDeliveryIndicator msg={message} />}
          renderReactions={
            !hasReactions
              ? undefined
              : //TODO: Add LeftRight StyleProp
                () => {
                  const maxVisible = 2;
                  const countExcludedFromView = reactions?.length
                    ? reactions?.length - maxVisible
                    : 0;

                  return (
                    <Pressable onPress={() => props.onReactionClick(message)}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          padding: 4,
                          borderRadius: 15,
                          backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                        }}
                      >
                        {flatReactions?.slice(0, maxVisible).map((reaction, index) => {
                          return (
                            <Text
                              key={index}
                              style={{
                                fontSize: 18,
                                marginRight: 2,
                              }}
                            >
                              {reaction}
                            </Text>
                          );
                        })}
                        {countExcludedFromView > 0 && (
                          <Text
                            style={{
                              color: isDarkMode ? Colors.white : Colors.black,
                              fontSize: 16,
                              fontWeight: '500',
                              marginRight: 2,
                            }}
                          >
                            +{countExcludedFromView}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                }
          }
          renderTime={(timeProp) => {
            return (
              <Time
                {...timeProp}
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
                    backgroundColor: isDarkMode ? `${Colors.gray[300]}4D` : `${Colors.gray[500]}1A`,
                    minWidth: hasReactions ? 90 : undefined,
                  },
                  right: {
                    backgroundColor: isDarkMode
                      ? `${Colors.indigo[500]}33`
                      : `${Colors.indigo[500]}1A`,
                  },
                }
          }
        />
      </>
    );
  }
);

const RenderReplyMessageView = memo((props: BubbleProps<ChatMessageIMessage>) => {
  const replyMessage = useChatMessage({
    messageId: props.currentMessage?.fileMetadata.appData.content.replyId,
  }).get.data;
  const { isDarkMode } = useDarkMode();
  if (!replyMessage) return null;
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
              color: isDarkMode ? Colors.slate[300] : Colors.slate[900],
            }}
          >
            {replyMessage?.fileMetadata.senderOdinId?.length > 0 ? (
              <ConnectionName odinId={replyMessage?.fileMetadata.senderOdinId} />
            ) : (
              'You'
            )}
          </Text>
          <Text
            style={{
              fontSize: 14,
              marginTop: 4,
              color: isDarkMode ? Colors.slate[300] : Colors.slate[900],
            }}
          >
            {replyMessage?.fileMetadata.appData.content.message || 'Media 📸'}
          </Text>
        </View>
        {replyMessage && replyMessage.fileMetadata.payloads?.length > 0 && (
          <OdinImage
            fileId={replyMessage.fileId}
            targetDrive={ChatDrive}
            fileKey={replyMessage.fileMetadata.payloads[0].key}
            previewThumbnail={replyMessage.fileMetadata.appData.previewThumbnail}
            imageSize={{
              width: 60,
              height: 60,
            }}
          />
        )}
      </View>
    )
  );
});

const PickImage = () => <Images />;

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

export default ChatPage;
