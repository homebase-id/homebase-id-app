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
import { useCallback, memo } from 'react';
import {
  GestureResponderEvent,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Close, Images, Microphone, SendChat, Times } from '../../components/ui/Icons/icons';
import MediaMessage from './MediaMessage';
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
import { useChatReaction } from '../../hooks/chat/useChatReaction';
import { Avatar as AppAvatar, OwnerAvatar } from '../../components/Chat/Conversation-tile';
import { ConnectionName } from '../../components/ui/Name';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useAudioRecorder } from '../../hooks/audio/useAudioRecorderPlayer';
import { Text } from '../ui/Text/Text';
import { millisToMinutesAndSeconds } from '../../utils/utils';

export type ChatMessageIMessage = IMessage & HomebaseFile<ChatMessage>;

export const ChatDetail = memo(
  ({
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

    hasMoreMessages,
    fetchMoreMessages,
  }: {
    isGroup: boolean;
    messages: ChatMessageIMessage[];
    doSend: (message: ChatMessageIMessage[]) => void;
    doSelectMessage: ({
      coords,
      message,
    }: {
      coords: { x: number; y: number };
      message: ChatMessageIMessage;
    }) => void;
    doOpenMessageInfo: (message: ChatMessageIMessage) => void;
    doOpenReactionModal: (message: ChatMessageIMessage) => void;

    replyMessage: ChatMessageIMessage | null;
    setReplyMessage: (message: ChatMessageIMessage | null) => void;

    assets: Asset[];
    setAssets: (assets: Asset[]) => void;

    hasMoreMessages: boolean;
    fetchMoreMessages: () => void;
  }) => {
    const { isDarkMode } = useDarkMode();
    const identity = useAuth().getIdentity();

    const onLongPress = useCallback(
      (e: GestureResponderEvent, message: ChatMessageIMessage) => {
        const { pageY, locationY } = e.nativeEvent;
        const y = pageY - locationY;

        doSelectMessage({ coords: { x: 0, y }, message });
      },
      [doSelectMessage]
    );

    const onLeftSwipe = useCallback(
      (message: ChatMessageIMessage) => doOpenMessageInfo(message),
      [doOpenMessageInfo]
    );

    const renderMessageBox = (props: MessageProps<ChatMessageIMessage>) => {
      return (
        <ChatMessageBox
          {...props}
          // onMessageLayout={onLayout}
          setReplyOnSwipeOpen={setReplyMessage}
          onLeftSwipeOpen={onLeftSwipe}
        />
      );
    };

    const renderChatFooter = useCallback(() => {
      return (
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}
        >
          {replyMessage ? (
            <ReplyMessageBar message={replyMessage} clearReply={() => setReplyMessage(null)} />
          ) : null}

          <ScrollView
            horizontal
            contentContainerStyle={{
              gap: 2,
            }}
            showsHorizontalScrollIndicator={false}
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
                    <TouchableOpacity
                      onPress={() => setAssets(assets.filter((_, i) => i !== index))}
                    >
                      <Close size={'sm'} color="white" />
                    </TouchableOpacity>
                  </ImageBackground>
                </View>
              );
            })}
          </ScrollView>
        </View>
      );
    }, [assets, isDarkMode, replyMessage, setAssets, setReplyMessage]);

    const { record, stop, duration, isRecording } = useAudioRecorder();
    const imagesIcon = useCallback(() => <Images />, []);
    const microphoneIcon = useCallback(() => <Microphone />, []);
    const crossIcon = useCallback(() => <Times />, []);

    const cancelRecording = useCallback(async () => {
      await stop();
    }, [stop]);

    const onStopRecording = useCallback(async () => {
      const audioPath = await stop();
      setAssets([
        {
          uri: audioPath,
          type: 'audio/mp3',
          fileName: 'recording',
          fileSize: 0,
          height: 0,
          width: 0,
          originalPath: audioPath,
          timestamp: new Date().toUTCString(),
          id: 'audio',
        },
      ] as Asset[]);
    }, [setAssets, stop]);

    const renderCustomInputToolbar = useCallback(
      (props: InputToolbarProps<IMessage>) => {
        return (
          <InputToolbar
            {...props}
            renderComposer={(props) => {
              if (isRecording) {
                return (
                  <View
                    style={{
                      flex: 1,
                      alignContent: 'center',
                      alignItems: 'center',
                      marginLeft: 10,
                      marginTop: Platform.select({
                        ios: 6,
                        android: 0,
                        web: 6,
                      }),
                      marginBottom: Platform.select({
                        ios: 5,
                        android: 3,
                        web: 4,
                      }),
                      flexDirection: 'row',
                      height: props.composerHeight,
                    }}
                  >
                    <Microphone color={Colors.red[600]} />

                    <Text style={{ marginLeft: 8, fontSize: 16 }}>
                      {millisToMinutesAndSeconds(duration)}
                    </Text>
                  </View>
                );
              }
              return (
                <Composer
                  {...props}
                  textInputStyle={{
                    color: isDarkMode ? 'white' : 'black',
                  }}
                />
              );
            }}
            renderSend={(props) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                }}
              >
                <Actions
                  icon={!isRecording ? microphoneIcon : crossIcon}
                  containerStyle={props.containerStyle}
                  onPressActionButton={async () => {
                    if (isRecording) {
                      await cancelRecording();
                      return;
                    } else {
                      await record();
                    }
                  }}
                />

                <View style={{ width: 12 }} />

                <Send
                  {...props}
                  disabled={isRecording ? false : !props.text && assets?.length === 0}
                  onSend={isRecording ? async (_) => await onStopRecording() : props.onSend}
                  text={props.text || ' '}
                  containerStyle={styles.send}
                >
                  <SendChat
                    size={'md'}
                    color={
                      isRecording ? 'blue' : !props.text && assets?.length === 0 ? 'grey' : 'blue'
                    }
                  />
                </Send>
              </View>
            )}
            renderActions={
              isRecording
                ? () => null
                : () => (
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
                  )
            }
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: isDarkMode ? Colors.slate[900] : Colors.white,
                borderTopWidth: 0,
                borderRadius: 10,
              },
            ]}
          />
        );
      },
      [
        isRecording,
        isDarkMode,
        duration,
        microphoneIcon,
        crossIcon,
        assets?.length,
        onStopRecording,
        cancelRecording,
        record,
        imagesIcon,
        setAssets,
      ]
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
        alwaysShowSend
        onLongPress={(e, _, m: ChatMessageIMessage) => onLongPress(e, m)}
        isKeyboardInternallyHandled={true}
        keyboardShouldPersistTaps="never"
        renderMessageImage={(prop: MessageImageProps<ChatMessageIMessage>) => (
          <MediaMessage {...prop} />
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
        loadEarlier={hasMoreMessages}
        onLoadEarlier={fetchMoreMessages}
      />
    );
  }
);

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
    maxWidth: '80%',
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
  const deleted = message?.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus;

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
          : deleted
          ? {
              textDecorationLine: 'line-through',
              color: Colors.gray[500],
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
            avoidPayload={true}
            enableZoom={false}
            style={{
              flex: 1,
            }}
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
