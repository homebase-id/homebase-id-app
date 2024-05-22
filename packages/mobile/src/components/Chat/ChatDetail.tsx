import {
  Actions,
  Avatar,
  AvatarProps,
  Bubble,
  BubbleProps,
  Composer,
  ComposerProps,
  GiftedChat,
  IMessage,
  InputToolbar,
  InputToolbarProps,
  LoadEarlier,
  MessageImageProps,
  MessageProps,
  MessageText,
  MessageTextProps,
  Send,
  SendProps,
  Time,
  TimeProps,
  User,
} from 'react-native-gifted-chat';
import { useCallback, memo, useMemo, useRef, useEffect, useState } from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StatusBar,
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  ArrowDown,
  Camera,
  Microphone,
  PaperClip,
  Plus,
  SendChat,
  Times,
} from '../../components/ui/Icons/icons';
import MediaMessage from './MediaMessage';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../hooks/auth/useAuth';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { Colors, getOdinIdColor } from '../../app/Colors';
import ReplyMessageBar from '../../components/Chat/Reply-Message-bar';
import ChatMessageBox from '../../components/Chat/Chat-Message-box';
import { OdinImage } from '../../components/ui/OdinImage/OdinImage';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatDeliveryIndicator } from '../../components/Chat/Chat-Delivery-Indicator';
import { useChatReaction } from '../../hooks/chat/useChatReaction';
import { Avatar as AppAvatar, OwnerAvatar } from '../../components/ui/Avatars/Avatar';
import { ConnectionName } from '../../components/ui/Name';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useAudioRecorder } from '../../hooks/audio/useAudioRecorderPlayer';
import { Text } from '../ui/Text/Text';
import { fixDocumentURI, millisToMinutesAndSeconds } from '../../utils/utils';
import { SafeAreaView } from '../ui/SafeAreaView/SafeAreaView';
import { FileOverview } from '../Files/FileOverview';
import Document from 'react-native-document-picker';
import { getLocales, uses24HourClock } from 'react-native-localize';
import { type PastedFile } from '@mattermost/react-native-paste-input';
import { useDraftMessage } from '../../hooks/chat/useDraftMessage';

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
    onPaste,
    hasMoreMessages,
    fetchMoreMessages,
    conversationId,
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
    onPaste: (error: string | null | undefined, files: PastedFile[]) => void;
    conversationId: string;
    replyMessage: ChatMessageIMessage | null;
    setReplyMessage: (message: ChatMessageIMessage | null) => void;

    assets: Asset[];
    setAssets: (assets: Asset[]) => void;

    hasMoreMessages: boolean;
    fetchMoreMessages: () => void;
  }) => {
    const { isDarkMode } = useDarkMode();
    const identity = useAuth().getIdentity();
    const textRef = useRef<TextInput>(null);

    // We will fetch the draft message from the cache only once
    const { mutate: onInputTextChanged } = useDraftMessage(conversationId).set;
    const [draftMessage, setdraftMessage] = useState<string | undefined>();

    const { getDraftMessage } = useDraftMessage(conversationId);
    useEffect(() => {
      (async () => {
        const draft = await getDraftMessage();
        if (!draft) return;
        setdraftMessage(draft);
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const debounceInputText = useCallback(
      (text: string) => {
        if (text === '' && draftMessage) {
          setdraftMessage(undefined);
        }
        return onInputTextChanged(text);
      },
      [draftMessage, onInputTextChanged]
    );

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

    const renderMessageBox = useCallback(
      (props: MessageProps<ChatMessageIMessage>) => {
        return (
          <ChatMessageBox
            {...props}
            setReplyOnSwipeOpen={setReplyMessage}
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
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          }}
        >
          {replyMessage ? (
            <ReplyMessageBar message={replyMessage} clearReply={() => setReplyMessage(null)} />
          ) : null}

          <FileOverview assets={assets} setAssets={setAssets} />
        </View>
      );
    }, [assets, isDarkMode, replyMessage, setAssets, setReplyMessage]);

    const { record, stop, duration, isRecording } = useAudioRecorder();

    const microphoneIcon = useCallback(() => <Microphone />, []);
    const cameraIcon = useCallback(() => <Camera />, []);
    const crossIcon = useCallback(() => <Times />, []);
    const attachmentIcon = useCallback(() => <PaperClip />, []);

    const onStopRecording = useCallback(() => {
      requestAnimationFrame(async () => {
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
      });
    }, [setAssets, stop]);

    const handleRecordButtonAction = useCallback(() => {
      requestAnimationFrame(async () => {
        if (isRecording) {
          await stop();
          return;
        } else {
          await record();
        }
      });
    }, [stop, isRecording, record]);

    const handleCameraButtonAction = useCallback(() => {
      requestAnimationFrame(async () => {
        const media = await launchCamera({
          mediaType: 'mixed',
          formatAsMp4: true,
          videoQuality: 'medium',
          presentationStyle: 'overFullScreen',
        });
        if (media.didCancel) return;
        setAssets(media.assets ?? []);
      });
    }, [setAssets]);

    const handleAttachmentButtonAction = useCallback(() => {
      requestAnimationFrame(async () => {
        const document = await Document.pickSingle({
          copyTo: 'cachesDirectory',
          type: [Document.types.allFiles],
          mode: 'open',
        });
        console.log(document);
        document.fileCopyUri = fixDocumentURI(document.fileCopyUri || document.uri);
        const asset: Asset = {
          uri: document.fileCopyUri,
          type: document.type || 'application/pdf',
          fileName: document.name || 'file',
          fileSize: document.size || 0,
          height: 0,
          width: 0,
          originalPath: document.fileCopyUri,
          timestamp: new Date().toUTCString(),
          id: document.name || 'file',
        };
        // if (media.didCancel) return;
        setAssets([asset]);
      });
    }, [setAssets]);

    const handleImageIconPress = useCallback(async () => {
      const medias = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 10,
      });
      if (medias.didCancel) return;
      setAssets(medias.assets ?? []);
    }, [setAssets]);

    const inputStyle = useMemo(
      () =>
        ({
          color: isDarkMode ? 'white' : 'black',
          flex: 1,
        }) as TextStyle,
      [isDarkMode]
    );

    const composerContainerStyle = useMemo(
      () =>
        ({
          borderRadius: 20,
          backgroundColor: isDarkMode ? Colors.slate[800] : Colors.indigo[50],
          flex: 1,
          flexDirection: 'row',
        }) as ViewStyle,
      [isDarkMode]
    );

    const renderComposer = useCallback(
      (props: ComposerProps) => {
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
            textInputStyle={inputStyle}
            containerStyle={composerContainerStyle}
            defaultValue={draftMessage}
          >
            {!props.hasText && !draftMessage && (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 4,
                }}
              >
                <Actions
                  icon={cameraIcon}
                  containerStyle={[
                    {
                      padding: 10,
                      alignContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'center',
                    },
                  ]}
                  onPressActionButton={handleCameraButtonAction}
                />
                <Actions
                  icon={microphoneIcon}
                  containerStyle={[
                    {
                      padding: 10,
                      alignContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'center',
                    },
                  ]}
                  onPressActionButton={handleRecordButtonAction}
                />
                <Actions
                  icon={attachmentIcon}
                  containerStyle={[
                    {
                      padding: 10,
                      marginRight: 10,
                      alignContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'center',
                    },
                  ]}
                  onPressActionButton={handleAttachmentButtonAction}
                />
              </View>
            )}
          </Composer>
        );
      },
      [
        attachmentIcon,
        cameraIcon,
        composerContainerStyle,
        draftMessage,
        duration,
        handleAttachmentButtonAction,
        handleCameraButtonAction,
        handleRecordButtonAction,
        inputStyle,
        isRecording,
        microphoneIcon,
      ]
    );
    useEffect(() => {
      if (replyMessage !== null && textRef.current) {
        textRef.current?.focus();
      }
    }, [textRef, replyMessage]);

    const renderSend = useCallback(
      (props: SendProps<IMessage>) => {
        const hasText = props.text || draftMessage;
        return (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 'auto',
              marginTop: 'auto',
            }}
          >
            {isRecording && (
              <Actions
                icon={crossIcon}
                containerStyle={[
                  {
                    paddingHorizontal: 20,
                    justifyContent: 'center',
                  },
                ]}
                onPressActionButton={handleRecordButtonAction}
              />
            )}
            <View style={{ width: 6 }} />

            <Send
              {...props}
              // disabled={isRecording ? false : !props.text && assets?.length === 0}
              disabled={false}
              text={props.text || draftMessage || ' '}
              // onSend={isRecording ? async (_) => onStopRecording() : props.onSend}
              onSend={
                isRecording
                  ? async (_) => onStopRecording()
                  : !hasText && assets?.length === 0
                    ? handleImageIconPress
                    : props.onSend
              }
              containerStyle={styles.send}
            >
              <View
                style={{
                  transform: [
                    {
                      rotate: hasText || assets.length !== 0 || isRecording ? '50deg' : '0deg',
                    },
                  ],
                }}
              >
                {hasText || assets.length !== 0 || isRecording ? (
                  <SendChat size={'md'} color={Colors.white} />
                ) : (
                  <Plus color={Colors.white} />
                )}
              </View>
            </Send>
          </View>
        );
      },
      [
        assets.length,
        crossIcon,
        draftMessage,
        handleImageIconPress,
        handleRecordButtonAction,
        isRecording,
        onStopRecording,
      ]
    );

    const renderUsername = useCallback(
      (user: User) => {
        if (user._id === identity || user._id === '') return null;
        const color = getOdinIdColor(user._id as string);
        return (
          <Text
            style={{
              marginHorizontal: 10,
              marginTop: 2,
              fontSize: 14,
              color: color.color(isDarkMode),
            }}
          >
            <ConnectionName odinId={user.name} />
          </Text>
        );
      },
      [identity, isDarkMode]
    );

    const inputContainerStyle: StyleProp<ViewStyle> = useMemo(() => {
      return {
        position: 'relative',
        flexDirection: 'column-reverse',
        backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        borderTopWidth: 0,
        borderRadius: 10,
        marginTop: Platform.OS === 'android' ? 'auto' : undefined,
      };
    }, [isDarkMode]);

    const renderInputToolbar = useCallback(
      (props: InputToolbarProps<IMessage>) => {
        return (
          <InputToolbar
            {...props}
            renderComposer={renderComposer}
            renderSend={renderSend}
            containerStyle={inputContainerStyle}
          />
        );
      },
      [renderComposer, renderSend, inputContainerStyle]
    );

    const renderAvatar = useCallback((props: AvatarProps<IMessage>) => {
      const prop = props as AvatarProps<ChatMessageIMessage>;
      const odinId = prop.currentMessage?.fileMetadata.senderOdinId;

      if (!odinId) {
        return (
          <Avatar
            {...prop}
            renderAvatar={(_: Omit<AvatarProps<ChatMessageIMessage>, 'renderAvatar'>) => {
              return (
                <OwnerAvatar
                  imageSize={{
                    width: 30,
                    height: 30,
                  }}
                  style={{
                    width: 30,
                    height: 30,
                  }}
                />
              );
            }}
          />
        );
      }
      return (
        <Avatar
          {...prop}
          renderAvatar={(_: Omit<AvatarProps<ChatMessageIMessage>, 'renderAvatar'>) => {
            return (
              <AppAvatar
                odinId={odinId}
                imageSize={{
                  width: 30,
                  height: 30,
                }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                }}
              />
            );
          }}
        />
      );
    }, []);

    const scrollToBottomStyle = useMemo(() => {
      return {
        backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[200],
        opacity: 1,
      };
    }, [isDarkMode]);
    const wrapperStyle: StyleProp<ViewStyle> = useMemo(() => {
      return {
        backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.slate[50],
        opacity: 1,
      };
    }, [isDarkMode]);

    const scrollToBottomComponent = useCallback(() => {
      return <ArrowDown />;
    }, []);

    const locale = getLocales()[0].languageTag;

    return (
      <SafeAreaView>
        <GiftedChat<ChatMessageIMessage>
          messages={messages}
          onSend={doSend}
          locale={locale}
          textInputRef={textRef}
          onInputTextChanged={debounceInputText}
          infiniteScroll
          scrollToBottom
          alwaysShowSend
          onLongPress={(e, _, m: ChatMessageIMessage) => onLongPress(e, m)}
          isKeyboardInternallyHandled={true}
          keyboardShouldPersistTaps="never"
          onPaste={onPaste}
          renderMessageImage={(prop: MessageImageProps<ChatMessageIMessage>) => (
            <MediaMessage props={prop} onLongPress={onLongPress} />
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
          renderInputToolbar={renderInputToolbar}
          renderUsername={renderUsername}
          user={{
            _id: identity || '',
          }}
          loadEarlier={hasMoreMessages}
          onLoadEarlier={fetchMoreMessages}
          scrollToBottomStyle={scrollToBottomStyle}
          scrollToBottomComponent={scrollToBottomComponent}
          renderLoadEarlier={(prop) => <LoadEarlier {...prop} wrapperStyle={wrapperStyle} />}
          listViewProps={{
            removeClippedSubviews: true,
            windowSize: 15,
          }}
        />
      </SafeAreaView>
    );
  }
);

const RenderMessageText = memo((props: MessageTextProps<IMessage>) => {
  const { isDarkMode } = useDarkMode();
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
          color: isDarkMode ? Colors.indigo[300] : Colors.indigo[500],
        },
        right: {
          color: isDarkMode ? Colors.indigo[300] : Colors.indigo[500],
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
    const flatReactions = useMemo(
      () => reactions?.flatMap((val) => val.fileMetadata.appData.content.message),
      [reactions]
    );
    // has pauload and no text but no audio payload
    const hasPayloadandNoText =
      message?.fileMetadata.payloads?.length > 0 &&
      !content?.message &&
      !message.fileMetadata.payloads?.some(
        (val) => val.contentType.startsWith('audio') || val.contentType.startsWith('application')
      );

    const renderTime = useCallback(
      (timeProp: TimeProps<ChatMessageIMessage>) => {
        const is24Hour = uses24HourClock();
        return (
          <Time
            {...timeProp}
            timeFormat={is24Hour ? 'HH:mm' : 'LT'}
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
                : hasPayloadandNoText
                  ? {
                      right: {
                        color: Colors.slate[100],
                        fontSize: 12,
                      },
                      left: {
                        color: Colors.slate[100],
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
      },
      [hasPayloadandNoText, isDarkMode, showBackground]
    );

    return (
      <Bubble
        {...props}
        renderTicks={(message: ChatMessageIMessage) => <ChatDeliveryIndicator msg={message} />}
        renderReactions={
          !hasReactions
            ? undefined
            : () => {
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
        renderTime={renderTime}
        tickStyle={{
          color: isDarkMode ? Colors.white : hasPayloadandNoText ? Colors.white : Colors.black,
        }}
        textStyle={
          showBackground
            ? {
                left: { color: isDarkMode ? Colors.white : Colors.black },
                right: { color: isDarkMode ? Colors.white : Colors.black },
              }
            : undefined
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
                  justifyContent: 'flex-start',
                },
                right: {
                  backgroundColor: isDarkMode
                    ? `${Colors.indigo[500]}33`
                    : `${Colors.indigo[500]}1A`,
                  minWidth: hasReactions ? 90 : undefined,
                },
              }
        }
        bottomContainerStyle={
          hasPayloadandNoText
            ? {
                right: {
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  zIndex: 10,
                },
                left: {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  zIndex: 10,
                },
              }
            : undefined
        }
      />
    );
  }
);

const RenderReplyMessageView = memo((props: BubbleProps<ChatMessageIMessage>) => {
  const { data: replyMessage } = useChatMessage({
    messageId: props.currentMessage?.fileMetadata.appData.content.replyId,
  }).get;
  const { isDarkMode } = useDarkMode();

  if (!props.currentMessage?.fileMetadata.appData.content.replyId) return null;
  const color = getOdinIdColor(replyMessage?.fileMetadata.senderOdinId || '');

  return (
    props.currentMessage &&
    props.currentMessage.fileMetadata.appData.content.replyId && (
      <View
        style={[
          styles.replyMessageContainer,
          {
            borderLeftColor:
              props.position === 'left' ? color.color(isDarkMode) : Colors.purple[500],
            backgroundColor: `${Colors.indigo[500]}1A`,
          },
        ]}
      >
        <View style={styles.replyText}>
          {replyMessage ? (
            <>
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 15,
                  color: color.color(isDarkMode),
                }}
              >
                {replyMessage?.fileMetadata.senderOdinId?.length > 0 ? (
                  <ConnectionName odinId={replyMessage?.fileMetadata.senderOdinId} />
                ) : (
                  'You'
                )}
              </Text>
              <Text
                numberOfLines={3}
                style={{
                  fontSize: 14,
                  marginTop: 4,
                  color: isDarkMode ? Colors.slate[300] : Colors.slate[900],
                }}
              >
                {replyMessage?.fileMetadata.appData.content.message || 'Media 📸'}
              </Text>
            </>
          ) : (
            <Text
              style={{
                fontSize: 14,
                fontStyle: 'italic',
                color: isDarkMode ? Colors.slate[400] : Colors.slate[600],
              }}
            >
              Message not found
            </Text>
          )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  replyText: {
    justifyContent: 'center',
    marginLeft: 6,
    marginRight: 12,
    flexShrink: 1,
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
    alignContent: 'center',
    marginRight: 8,
    height: 40,
    width: 40,
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.indigo[500],
  },
});
