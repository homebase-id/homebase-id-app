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
import { useCallback, useState, memo } from 'react';
import {
  GestureResponderEvent,
  ImageBackground,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Close, Images, SendChat } from '../../components/ui/Icons/icons';
import ImageMessage from '../../components/Chat/ImageMessage';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../hooks/auth/useAuth';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../../app/Colors';
import ReplyMessageBar from '../../components/Chat/Reply-Message-bar';
import ChatMessageBox from '../../components/Chat/Chat-Message-box';
import { OdinImage } from '../../components/ui/OdinImage/OdinImage';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatDeliveryIndicator } from '../../components/Chat/Chat-Delivery-Indicator';
import { HighlightedChatMessage } from '../../components/Chat/Chat-Reaction';
import { useChatReaction } from '../../hooks/chat/useChatReaction';
import { Avatar as AppAvatar, OwnerAvatar } from '../../components/Chat/Conversation-tile';
import { ConnectionName } from '../../components/ui/Name';
import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { ChatMessage } from '../../provider/chat/ChatProvider';

export interface ChatMessageIMessage extends IMessage, DriveSearchResult<ChatMessage> {}

export const ChatDetail = ({
  isGroup,

  messages,
  doSend,
  doSelectMessage,
  doOpenMessageInfo,
  doOpenReactionModal,

  replyMessage,
  setReplyMessage,

  assets,
  setAssets,
}: {
  isGroup: boolean;

  messages: ChatMessageIMessage[];
  doSend: (message: IMessage[]) => void;
  doSelectMessage: ({
    coords,
    message,
  }: {
    coords: { x: number; y: number };
    message: HighlightedChatMessage;
  }) => void;
  doOpenMessageInfo: (message: ChatMessageIMessage) => void;
  doOpenReactionModal: (message: ChatMessageIMessage) => void;

  replyMessage: ChatMessageIMessage | null;
  setReplyMessage: (message: ChatMessageIMessage | null) => void;

  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
}) => {
  const { isDarkMode } = useDarkMode();

  const identity = useAuth().getIdentity();

  const [layoutHeight, setLayoutHeight] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    setLayoutHeight(height);
  };

  const onLongPress = useCallback(
    (e: GestureResponderEvent, message: ChatMessageIMessage) => {
      const { pageY, locationY } = e.nativeEvent;
      const y = pageY - locationY;

      doSelectMessage({ coords: { x: 0, y }, message: { layoutHeight, ...message } });
    },
    [layoutHeight, doSelectMessage]
  );

  const onLeftSwipe = useCallback(
    (message: ChatMessageIMessage) => doOpenMessageInfo(message),
    [doOpenMessageInfo]
  );

  const renderMessageBox = useCallback(
    (props: MessageProps<ChatMessageIMessage>) => {
      return (
        <ChatMessageBox
          {...props}
          setReplyOnSwipeOpen={setReplyMessage}
          onMessageLayout={onLayout}
          onLeftSwipeOpen={onLeftSwipe}
        />
      );
    },
    [onLeftSwipe, setReplyMessage]
  );

  const renderChatFooter = useCallback(() => {
    return (
      <View
        style={{
          backgroundColor: Colors.white,
        }}
      >
        {replyMessage ? (
          <ReplyMessageBar message={replyMessage} clearReply={() => setReplyMessage(null)} />
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            gap: 2,
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
                    width: 65,
                    height: 65,
                    alignItems: 'flex-end',
                    padding: 4,
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
      </View>
    );
  }, [assets, replyMessage, setAssets, setReplyMessage]);

  const imagesIcon = useCallback(() => <Images />, []);
  const renderCustomInputToolbar = useCallback(
    (props: InputToolbarProps<IMessage>) => {
      return (
        <>
          <InputToolbar
            {...props}
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
                icon={imagesIcon}
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
                backgroundColor: isDarkMode ? Colors.slate[900] : Colors.white,
                borderTopWidth: 0,
                borderRadius: 10,
              },
            ]}
          />
        </>
      );
    },
    [isDarkMode, assets?.length, imagesIcon, setAssets]
  );

  const renderAvatar = useCallback((props: AvatarProps<IMessage>) => {
    const prop = props as AvatarProps<ChatMessageIMessage>;
    const odinId = prop.currentMessage?.fileMetadata.senderOdinId;

    if (!odinId) {
      return (
        <Avatar
          renderAvatar={(_: Omit<AvatarProps<ChatMessageIMessage>, 'renderAvatar'>) => {
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
        renderAvatar={(_: Omit<AvatarProps<ChatMessageIMessage>, 'renderAvatar'>) => {
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
  }, []);

  return (
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
      renderBubble={(prop) => <RenderBubble {...prop} onReactionClick={doOpenReactionModal} />}
      renderMessageText={(prop) => <RenderMessageText {...prop} />}
      renderMessage={renderMessageBox}
      // renderChatFooter instead of renderFooter as the renderFooter renders within the scrollView
      renderChatFooter={renderChatFooter}
      showUserAvatar={false}
      renderUsernameOnMessage={isGroup}
      renderAvatar={isGroup ? renderAvatar : null}
      renderInputToolbar={renderCustomInputToolbar}
      user={{
        _id: identity || '',
      }}
    />
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

const RenderMessageText = memo((props: MessageTextProps<IMessage>) => {
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
});

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
