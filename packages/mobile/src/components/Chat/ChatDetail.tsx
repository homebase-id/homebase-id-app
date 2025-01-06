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
import React, { useCallback, memo, useMemo, useRef, useEffect, useState } from 'react';
import {
  Keyboard,
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
  ImageLibrary,
  Microphone,
  PaperClip,
  Plus,
  SendChat,
  Times,
} from '../../components/ui/Icons/icons';
import MediaMessage from './MediaMessage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../hooks/auth/useAuth';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { Colors, getOdinIdColor } from '../../app/Colors';
import ReplyMessageBar from '../../components/Chat/Reply-Message-bar';
import ChatMessageBox from '../../components/Chat/Chat-Message-box';
import { OdinImage } from '../../components/ui/OdinImage/OdinImage';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatDeliveryIndicator } from '../../components/Chat/Chat-Delivery-Indicator';
import { Avatar as AppAvatar, OwnerAvatar } from '../../components/ui/Avatars/Avatar';
import { AuthorName, ConnectionName } from '../../components/ui/Name';
import { DEFAULT_PAYLOAD_KEY, HomebaseFile } from '@homebase-id/js-lib/core';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useAudioRecorder } from '../../hooks/audio/useAudioRecorderPlayer';
import { Text } from '../ui/Text/Text';
import {
  assetsToImageSource,
  fixDocumentURI,
  isEmojiOnly,
  millisToMinutesAndSeconds,
  openURL,
  URL_PATTERN,
} from '../../utils/utils';
import { SafeAreaView } from '../ui/SafeAreaView/SafeAreaView';
import Document from 'react-native-document-picker';
import { getLocales, uses24HourClock } from 'react-native-localize';
import { type PastedFile } from '@mattermost/react-native-paste-input';
import { useDraftMessage } from '../../hooks/chat/useDraftMessage';
import { useBubbleContext } from '../BubbleContext/useBubbleContext';
import { ChatMessageContent } from './Chat-Message-Content';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FlatList, TouchableHighlight } from 'react-native-gesture-handler';
import { ParseShape } from 'react-native-gifted-chat/src/MessageText';
import { MentionDropDown } from './Mention-Dropdown';
import { LinkPreviewBar } from './Link-Preview-Bar';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { tryJsonParse } from '@homebase-id/js-lib/helpers';
import { EmptyChatContainer } from './EmptyChatContainer';
import { getPlainTextFromRichText } from 'homebase-id-app-common';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { useChatMessagePayload } from '../../hooks/chat/useChatMessagePayload';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';

export type ChatMessageIMessage = IMessage & HomebaseFile<ChatMessage>;

export const ChatDetail = memo(
  ({
    initialMessage,
    isGroup,
    messages,
    doSend,
    doSelectMessage,
    doOpenMessageInfo,
    doOpenReactionModal,
    doOpenRetryModal,
    replyMessage,
    setReplyMessage,
    onPaste,
    hasMoreMessages,
    fetchMoreMessages,
    conversationId,
    onLinkData,
    onDismissLinkPreview,
    onAssetsAdded,
  }: {
    initialMessage?: string;
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
    doOpenRetryModal: (message: ChatMessageIMessage) => void;
    onPaste: (error: string | null | undefined, files: PastedFile[]) => void;
    conversationId: string;
    replyMessage: ChatMessageIMessage | null;
    setReplyMessage: (message: ChatMessageIMessage | null) => void;
    hasMoreMessages: boolean;
    fetchMoreMessages: () => void;
    onLinkData: (linkPreview: LinkPreview) => void;
    onDismissLinkPreview: () => void;

    onAssetsAdded: (assets: ImageSource[]) => void;
  }) => {
    const { isDarkMode } = useDarkMode();
    const identity = useAuth().getIdentity();

    const textRef = useRef<TextInput>(null);

    const [draftMessage, setdraftMessage] = useState<string | undefined>(initialMessage);
    const messageContainerRef = useRef<FlatList<IMessage>>(null);

    const _doSend = useCallback(
      (message: ChatMessageIMessage[]) => {
        doSend(message);
        setdraftMessage(undefined);
        messageContainerRef.current?.scrollToIndex({ index: 0, animated: true });
      },
      [doSend]
    );

    // We will fetch the draft message from the cache only once
    const {
      getDraftMessage,
      set: { mutate: onInputTextChanged },
    } = useDraftMessage(conversationId);

    // Fetch draftmessage only once when the component mounts
    useEffect(() => {
      (async () => {
        const draft = await getDraftMessage();
        if (!draft) return;
        setdraftMessage(draft);
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onTextInputChanged = useCallback(
      (text: string) => {
        if (text === '' && draftMessage) {
          setdraftMessage(undefined);
        }
        return onInputTextChanged(text);
      },
      [draftMessage, onInputTextChanged]
    );

    const onLongPress = useCallback(
      (
        coords: {
          x: number;
          y: number;
          absoluteX: number;
          absoluteY: number;
        },
        message: ChatMessageIMessage
      ) => {
        const { absoluteY, y } = coords;
        const newY = absoluteY - y;

        doSelectMessage({ coords: { x: 0, y: newY }, message });
      },
      [doSelectMessage]
    );

    const onLeftSwipe = useCallback(
      (message: ChatMessageIMessage) => doOpenMessageInfo(message),
      [doOpenMessageInfo]
    );

    const renderMessageBox = useCallback(
      ({ key, ...props }: MessageProps<ChatMessageIMessage>) => {
        return (
          <ChatMessageBox
            key={key}
            {...props}
            setReplyOnSwipeOpen={setReplyMessage}
            onLeftSwipeOpen={onLeftSwipe}
          />
        );
      },
      [onLeftSwipe, setReplyMessage]
    );

    const renderChatFooter = useCallback(
      (
        text: string | undefined,
        updateText: React.Dispatch<React.SetStateAction<string | undefined>>
      ) => {
        const onMention = (mention: string) => {
          if (!text) return;
          const words = text.split(' ');
          words[words.length - 1] = `@${mention}`;
          updateText(words.join(' ') + ' ');
        };

        return (
          <Animated.View
            style={{
              backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
            }}
          >
            {isGroup && (
              <MentionDropDown
                conversationId={conversationId}
                query={text || ''}
                onMention={onMention}
              />
            )}
            <LinkPreviewBar
              textToSearchIn={text || draftMessage || ''}
              onDismiss={onDismissLinkPreview}
              onLinkData={onLinkData}
            />
            {replyMessage ? (
              <ReplyMessageBar message={replyMessage} clearReply={() => setReplyMessage(null)} />
            ) : null}
          </Animated.View>
        );
      },
      [
        isDarkMode,
        isGroup,
        conversationId,
        draftMessage,
        onDismissLinkPreview,
        onLinkData,
        replyMessage,
        setReplyMessage,
      ]
    );

    const { record, stop, duration, isRecording } = useAudioRecorder();

    const microphoneIcon = useCallback(() => <Microphone />, []);
    const cameraIcon = useCallback(() => <Camera />, []);
    const crossIcon = useCallback(() => <Times />, []);

    const onStopRecording = useCallback(() => {
      requestAnimationFrame(async () => {
        const { path, duration } = await stop();
        const audio: ImageSource = {
          uri: path,
          type: 'audio/mp3',
          filename: 'recording',
          playableDuration: duration,
          fileSize: 0,
          height: 0,
          width: 0,
          date: Date.parse(new Date().toUTCString()),
          id: 'audio',
        };
        onAssetsAdded([audio]);
      });
    }, [onAssetsAdded, stop]);

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
        const assets: ImageSource[] = media.assets ? assetsToImageSource(media.assets) : [];
        onAssetsAdded(assets);
      });
    }, [onAssetsAdded]);

    const handleAttachmentButtonAction = useCallback(() => {
      requestAnimationFrame(async () => {
        const document = await Document.pickSingle({
          copyTo: 'cachesDirectory',
          type: [
            Document.types.pdf,
            Document.types.doc,
            Document.types.docx,
            Document.types.json,
            Document.types.zip,
          ], // Don't add support for all files. Keeping it pdf and docs for now
          mode: 'open',
        });
        document.fileCopyUri = fixDocumentURI(document.fileCopyUri || document.uri);
        const asset: ImageSource = {
          uri: document.fileCopyUri,
          type: document.type || 'application/pdf',
          fileSize: document.size || 0,
          filepath: document.uri,
          height: 0,
          width: 0,
          id: document.name || 'file',
        };
        onAssetsAdded([asset]);
        setBottomContainerVisible(false);
      });
    }, [onAssetsAdded]);

    const [bottomContainerVisible, setBottomContainerVisible] = useState(false);

    const handlePlusIconPress = useCallback(async () => {
      if (Keyboard.isVisible()) Keyboard.dismiss();
      setBottomContainerVisible(!bottomContainerVisible);
    }, [bottomContainerVisible]);

    const handleImageIconPress = useCallback(async () => {
      const medias = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 10,
        formatAsMp4: true,
        includeExtra: true,
      });
      if (medias.didCancel) return;
      const assets: ImageSource[] = medias.assets ? assetsToImageSource(medias.assets) : [];

      onAssetsAdded(assets);
      setBottomContainerVisible(false);
    }, [onAssetsAdded]);

    const inputStyle = useMemo(
      () =>
        ({
          color: isDarkMode ? 'white' : 'black',
          maxHeight: 80,
          paddingVertical: Platform.OS === 'ios' ? 8 : 4,
          flexGrow: 1,
          fontSize: 16,
        }) as TextStyle,
      [isDarkMode]
    );

    const composerContainerStyle = useMemo(
      () =>
        ({
          borderRadius: 20,
          paddingVertical: 3,
          paddingHorizontal: 15,
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
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Actions
                  icon={cameraIcon}
                  containerStyle={[
                    {
                      padding: 6, // Max padding that doesn't break the composer height
                      marginLeft: 0, // Done with flex gap
                      width: 'auto',
                      height: 'auto',
                    },
                  ]}
                  onPressActionButton={handleCameraButtonAction}
                />
                <Actions
                  icon={microphoneIcon}
                  containerStyle={[
                    {
                      padding: 6, // Max padding that doesn't break the composer height
                      marginLeft: 0, // Done with flex gap
                      width: 'auto',
                      height: 'auto',
                    },
                  ]}
                  onPressActionButton={handleRecordButtonAction}
                />
              </View>
            )}
          </Composer>
        );
      },
      [
        isRecording,
        inputStyle,
        composerContainerStyle,
        draftMessage,
        cameraIcon,
        handleCameraButtonAction,
        microphoneIcon,
        handleRecordButtonAction,
        duration,
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
              flexShrink: 0,
              flexGrow: 0,
              gap: 6,
            }}
          >
            {isRecording && (
              <Actions
                icon={crossIcon}
                containerStyle={[
                  {
                    padding: 10,
                    justifyContent: 'center',
                    marginBottom: 0,
                  },
                ]}
                onPressActionButton={handleRecordButtonAction}
              />
            )}

            <Send
              {...props}
              // disabled={isRecording ? false : !props.text && assets?.length === 0}
              disabled={false}
              text={props.text || draftMessage || ' '}
              // onSend={isRecording ? async (_) => onStopRecording() : props.onSend}
              onSend={
                isRecording
                  ? async (_) => onStopRecording()
                  : !hasText
                    ? handlePlusIconPress
                    : props.onSend
              }
              containerStyle={chatStyles.send}
            >
              <View
                style={{
                  transform: [
                    {
                      rotate:
                        hasText || isRecording
                          ? '50deg'
                          : bottomContainerVisible
                            ? '45deg'
                            : '0deg',
                    },
                  ],
                }}
              >
                {hasText || isRecording ? (
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
        bottomContainerVisible,
        crossIcon,
        draftMessage,
        handlePlusIconPress,
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
        paddingHorizontal: 7,
        paddingBottom: 7,
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

    const renderAvatar = useCallback(
      (props: AvatarProps<IMessage>) => {
        const prop = props as AvatarProps<ChatMessageIMessage>;
        const odinId = prop.currentMessage?.fileMetadata.senderOdinId;
        if (!odinId || odinId === identity) {
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
      },
      [identity]
    );

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

    useEffect(() => {
      const listener = Keyboard.addListener('keyboardDidShow', () => {
        if (bottomContainerVisible) setBottomContainerVisible(false);
      });
      return () => listener.remove();
    }, [bottomContainerVisible]);

    const renderBottomContainer = useMemo(
      () => (
        <RenderBottomContainer
          isVisible={bottomContainerVisible}
          onAttachmentPressed={handleAttachmentButtonAction}
          onGalleryPressed={handleImageIconPress}
        />
      ),
      [bottomContainerVisible, handleAttachmentButtonAction, handleImageIconPress]
    );

    const renderMessageImage = useCallback(
      (prop: MessageImageProps<ChatMessageIMessage>) => (
        <MediaMessage props={prop} onLongPress={onLongPress} />
      ),
      [onLongPress]
    );

    const onReplyMessagePressed = useCallback(
      (message: HomebaseFile<ChatMessage> | null | undefined) => {
        if (!message) return;
        const index = messages.findIndex(
          (m) => m._id === (message.fileMetadata.appData.uniqueId || message.fileId || '')
        );
        console.log('onReplyMessagePressed', index);
        if (index === -1) return;
        messageContainerRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      },
      [messages]
    );

    const renderCustomView = useCallback(
      (prop: BubbleProps<ChatMessageIMessage>) => (
        <RenderReplyMessageView {...prop} onReplyPress={onReplyMessagePressed} />
      ),
      [onReplyMessagePressed]
    );

    const renderEmptyChat = useCallback(
      () => <EmptyChatContainer doSend={doSend as (message: { text: string }[]) => void} />,
      [doSend]
    );

    return (
      <SafeAreaView>
        <GiftedChat<ChatMessageIMessage>
          messageContainerRef={messageContainerRef}
          messages={messages}
          onSend={_doSend}
          locale={locale}
          textInputRef={textRef}
          onInputTextChanged={onTextInputChanged}
          infiniteScroll
          scrollToBottom
          alwaysShowSend
          onLongPress={(e, _, m: ChatMessageIMessage) => onLongPress(e, m)}
          isKeyboardInternallyHandled={true}
          keyboardShouldPersistTaps="never"
          onPaste={onPaste}
          renderMessageImage={renderMessageImage}
          renderCustomView={renderCustomView}
          renderBubble={(prop) => (
            <RenderBubble
              {...prop}
              onReactionClick={doOpenReactionModal}
              onRetryClick={doOpenRetryModal}
            />
          )}
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
          renderBottomFooter={bottomContainerVisible ? renderBottomContainer : undefined}
          scrollToBottomComponent={scrollToBottomComponent}
          renderLoadEarlier={(prop) => <LoadEarlier {...prop} wrapperStyle={wrapperStyle} />}
          listViewProps={{
            removeClippedSubviews: true,
            windowSize: 15,
          }}
          renderChatEmpty={renderEmptyChat}
        />
      </SafeAreaView>
    );
  }
);

const RenderBottomContainer = memo(
  ({
    isVisible,
    onGalleryPressed,
    onAttachmentPressed,
  }: {
    isVisible?: boolean;
    onGalleryPressed: () => void;
    onAttachmentPressed: () => void;
  }) => {
    const { isDarkMode } = useDarkMode();
    const height = useSharedValue(0);
    useEffect(() => {
      if (isVisible) {
        height.value = 250;
      } else {
        height.value = 0;
      }
    }, [height, isVisible]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        height: withTiming(height.value, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        opacity: withTiming(height.value > 0 ? 1 : 0, { duration: 300 }),
      };
    });

    return (
      <Animated.View
        style={[
          animatedStyle,
          {
            height: Platform.select({
              ios: 250,
            }),
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          },
        ]}
      >
        <MediaPickerComponent icon={<ImageLibrary />} onPress={onGalleryPressed} title="Gallery" />
        <MediaPickerComponent
          icon={<PaperClip />}
          onPress={onAttachmentPressed}
          title="Attachment"
        />
      </Animated.View>
    );
  }
);

const MediaPickerComponent = ({
  icon,
  onPress,
  title,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  title: string;
}) => {
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      <TouchableHighlight
        onPress={onPress}
        underlayColor={isDarkMode ? Colors.indigo[900] : Colors.indigo[300]}
        style={{
          padding: 18,
          borderRadius: 10,
          backgroundColor: isDarkMode ? Colors.indigo[800] : Colors.indigo[200],
          margin: 10,
        }}
      >
        {icon}
      </TouchableHighlight>
      <Text>{title}</Text>
    </View>
  );
};

const RenderMessageText = memo((props: MessageTextProps<IMessage>) => {
  const { isDarkMode } = useDarkMode();
  const [message, setMessage] = useState(props.currentMessage as ChatMessageIMessage);
  const deleted = message?.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus;
  const hasMoreTextContent = message?.fileMetadata?.payloads?.some(
    (e) => e.key === DEFAULT_PAYLOAD_KEY
  );
  const { data: completeMessage } = useChatMessagePayload({
    fileId: message.fileId,
    payloadKey: hasMoreTextContent ? DEFAULT_PAYLOAD_KEY : undefined,
  }).getExpanded;

  const allowExpand = hasMoreTextContent && !!completeMessage;
  const content = message?.fileMetadata.appData.content;
  const plainMessage = getPlainTextFromRichText(content.message);
  const onlyEmojis = isEmojiOnly(plainMessage);
  /**
   * An array of parse patterns used for parsing text in the chat detail component.
   * Each pattern consists of a regular expression pattern, a style to apply to the matched text,
   * an onPress function to handle the press event, and a renderText function to customize the rendered text.
   * @param linkStyle The style to apply to the matched text.
   * @returns An array of parse patterns.
   */
  const parsePatterns = useCallback((linkStyle: StyleProp<TextStyle>): ParseShape[] => {
    const pattern = /(^|\s)@[a-zA-Z0-9._-]+(?!@)/;
    return [
      {
        pattern: pattern,
        style: [
          linkStyle,
          {
            textDecorationLine: 'none',
          },
        ],
        onPress: (text: string) => openURL(`https://${text}`),
        renderText: (text: string) => {
          return (<AuthorName odinId={text.slice(1)} showYou={false} />) as unknown as string;
        },
      },
      {
        pattern: URL_PATTERN,
        style: linkStyle,
        onPress: (text: string) => openURL(text),
        onLongPress: (text: string) => {
          Clipboard.setString(text);
          Toast.show({
            type: 'info',
            text1: 'Copied to clipboard',
            position: 'bottom',
          });
        },
      },
    ];
  }, []);

  useEffect(() => {
    if (!completeMessage) {
      setMessage(props.currentMessage as ChatMessageIMessage);
    } else {
      const message = props.currentMessage as ChatMessageIMessage;
      message.text = completeMessage.message;
      setMessage(message);
    }
  }, [completeMessage, props.currentMessage]);

  const onExpand = useCallback(() => {
    if (!hasMoreTextContent || !completeMessage) return;
    const message = props.currentMessage as ChatMessageIMessage;
    message.text = completeMessage.message;
    setMessage(message);
  }, [hasMoreTextContent, completeMessage, props]);

  return (
    <MessageText
      {...props}
      currentMessage={message}
      parsePatterns={parsePatterns}
      linkStyle={{
        left: {
          color: isDarkMode ? Colors.indigo[300] : Colors.indigo[500],
        },
        right: {
          color: isDarkMode ? Colors.violet[100] : Colors.violet[100],
          fontWeight: '500',
        },
      }}
      allowExpand={allowExpand}
      onExpandPress={onExpand}
      customTextStyle={
        onlyEmojis
          ? {
              fontSize: 48,
              lineHeight: 60,
            }
          : deleted
            ? {
                textDecorationLine: 'line-through',
                color: props.position === 'left' ? Colors.gray[500] : Colors.gray[300],
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
      onRetryClick: (message: ChatMessageIMessage) => void;
    } & Readonly<BubbleProps<IMessage>>
  ) => {
    const { bubbleColor } = useBubbleContext();
    const { isDarkMode } = useDarkMode();

    const message = props.currentMessage as ChatMessageIMessage;
    const content = message?.fileMetadata.appData.content;

    const plainMessage = getPlainTextFromRichText(content.message);
    const onlyEmojis = isEmojiOnly(plainMessage);
    const isReply = !!content?.replyId;
    const showBackground = !onlyEmojis || isReply;

    const onRetryOpen = useCallback(() => {
      props.onRetryClick(message);
    }, [message, props]);

    const reactions =
      (message.fileMetadata.reactionPreview?.reactions &&
        Object.values(message.fileMetadata.reactionPreview?.reactions).map((reaction) => {
          return tryJsonParse<{ emoji: string }>(reaction.reactionContent).emoji;
        })) ||
      [];
    const filteredEmojis = Array.from(new Set(reactions));
    const hasReactions = (reactions && reactions?.length > 0) || false;

    // has pauload and no text but no audio payload
    const hasPayloadandNoText =
      message?.fileMetadata.payloads &&
      message?.fileMetadata.payloads?.length > 0 &&
      !content?.message &&
      !message?.fileMetadata?.payloads?.some(
        (val) => val.contentType.startsWith('audio') || val.contentType.startsWith('application')
      );

    const deleted = message?.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus;

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
                        color: !isDarkMode ? Colors.slate[300] : Colors.slate[200],
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
        renderTicks={(message: ChatMessageIMessage) => (
          <ChatDeliveryIndicator msg={message} onPress={onRetryOpen} />
        )}
        renderReactions={
          !hasReactions || deleted
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
                      {filteredEmojis?.slice(0, maxVisible).map((reaction, index) => {
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
                // right: { color: isDarkMode ? Colors.white : Colors.black },
                right: { color: Colors.white },
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
                  backgroundColor: bubbleColor?.color,
                  // backgroundColor: isDarkMode
                  //   ? `${bubbleColor?.color}33`
                  //   : `${bubbleColor?.color}1A`,
                  // backgroundColor: isDarkMode
                  //   ? `${Colors.indigo[500]}33`
                  //   : `${Colors.indigo[500]}1A`,
                  minWidth: hasReactions ? 90 : undefined,
                },
              }
        }
        gradientWrapperStyle={
          !showBackground
            ? undefined
            : {
                right: bubbleColor?.gradient,
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

const RenderReplyMessageView = memo(
  (
    props: BubbleProps<ChatMessageIMessage> & {
      onReplyPress: (message: HomebaseFile<ChatMessage> | null | undefined) => void;
    }
  ) => {
    const { data: replyMessage } = useChatMessage({
      conversationId: props.currentMessage?.fileMetadata.appData.groupId,
      messageId: props.currentMessage?.fileMetadata.appData.content.replyId,
    }).get;
    const { isDarkMode } = useDarkMode();

    if (!props.currentMessage?.fileMetadata.appData.content.replyId) return null;
    const color = getOdinIdColor(replyMessage?.fileMetadata.senderOdinId || '');

    return (
      props.currentMessage &&
      props.currentMessage.fileMetadata.appData.content.replyId && (
        <Pressable onPress={() => props.onReplyPress(replyMessage)}>
          <View
            style={[
              chatStyles.replyMessageContainer,
              {
                borderLeftColor:
                  props.position === 'left' ? color.color(isDarkMode) : Colors.purple[500],
                backgroundColor: `${Colors.indigo[500]}1A`,
              },
            ]}
          >
            <View style={chatStyles.replyText}>
              {replyMessage ? (
                <>
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 15,
                      color: color.color(props.position === 'right' ? true : isDarkMode),
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
                      color:
                        props.position === 'right'
                          ? Colors.slate[300]
                          : isDarkMode
                            ? Colors.slate[300]
                            : Colors.slate[900],
                    }}
                  >
                    <ChatMessageContent {...replyMessage} />
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
            {replyMessage &&
              replyMessage.fileMetadata.payloads &&
              replyMessage.fileMetadata.payloads?.length > 0 &&
              replyMessage.fileMetadata.payloads[0].contentType.startsWith('image') && (
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
        </Pressable>
      )
    );
  }
);

export const chatStyles = StyleSheet.create({
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
    height: 40,
    width: 40,
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.indigo[500],
  },
});
