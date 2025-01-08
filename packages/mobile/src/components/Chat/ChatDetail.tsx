import {
  Actions,
  Avatar,
  AvatarProps,
  BubbleProps,
  Composer,
  ComposerProps,
  GiftedChat,
  IMessage,
  InputToolbar,
  InputToolbarProps,
  LoadEarlier,
  Message,
  MessageImageProps,
  MessageProps,
  Send,
  SendProps,
  User,
} from 'react-native-gifted-chat';
import React, { useCallback, memo, useMemo, useRef, useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
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
  Info,
  Microphone,
  Plus,
  Reply,
  SendChat,
  Times,
} from '../../components/ui/Icons/icons';
import MediaMessage from './MediaMessage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../hooks/auth/useAuth';
import { Colors, getOdinIdColor } from '../../app/Colors';
import ReplyMessageBar from '../../components/Chat/Reply-Message-bar';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Avatar as AppAvatar, OwnerAvatar } from '../../components/ui/Avatars/Avatar';
import { ConnectionName } from '../../components/ui/Name';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useAudioRecorder } from '../../hooks/audio/useAudioRecorderPlayer';
import { Text } from '../ui/Text/Text';
import { assetsToImageSource, fixDocumentURI, millisToMinutesAndSeconds } from '../../utils/utils';
import { SafeAreaView } from '../ui/SafeAreaView/SafeAreaView';
import Document from 'react-native-document-picker';
import { getLocales } from 'react-native-localize';
import { type PastedFile } from '@mattermost/react-native-paste-input';
import { useDraftMessage } from '../../hooks/chat/useDraftMessage';
import { FlatList } from 'react-native-gesture-handler';
import { MentionDropDown } from './Mention-Dropdown';
import { LinkPreviewBar } from './Link-Preview-Bar';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { EmptyChatContainer } from './EmptyChatContainer';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { RenderBottomContainer } from './ui/RenderBottomContainer';
import Animated from 'react-native-reanimated';
import { RenderMessageText } from './ui/RenderMessageText';
import { RenderBubble } from './ui/RenderBubble';
import { RenderReplyMessageView } from './ui/RenderReplyMessageView';

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
    selectedMessage,
  }: {
    initialMessage?: string;
    isGroup: boolean;
    messages: ChatMessageIMessage[];
    selectedMessage?: ChatMessageIMessage;
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
    //Hooks
    const { isDarkMode } = useDarkMode();
    const identity = useAuth().getIdentity();
    const { record, stop, duration, isRecording } = useAudioRecorder();

    // We will fetch the draft message from the cache only once
    const {
      getDraftMessage,
      set: { mutate: onInputTextChanged },
    } = useDraftMessage(conversationId);
    const textRef = useRef<TextInput>(null);
    const messageContainerRef = useRef<FlatList<IMessage>>(null);

    const [draftMessage, setdraftMessage] = useState<string | undefined>(initialMessage);
    const [bottomContainerVisible, setBottomContainerVisible] = useState(false);

    // Icons Callback
    const microphoneIcon = useCallback(() => <Microphone />, []);
    const cameraIcon = useCallback(() => <Camera />, []);
    const crossIcon = useCallback(() => <Times />, []);
    const scrollToBottomComponent = useCallback(() => <ArrowDown />, []);

    const locale = getLocales()[0].languageTag;

    /* Functions Callback */
    const _doSend = useCallback(
      (message: ChatMessageIMessage[]) => {
        doSend(message);
        setdraftMessage(undefined);
        messageContainerRef.current?.scrollToIndex({ index: 0, animated: true });
      },
      [doSend]
    );

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

    // Style Memoization
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

    /* Component Function Callbacks */
    const renderMessageBox = useCallback(
      ({ key, ...props }: MessageProps<ChatMessageIMessage>) => {
        const enabled =
          props.currentMessage &&
          props.currentMessage.fileMetadata.appData.archivalStatus !== ChatDeletedArchivalStaus;
        const isSelected = selectedMessage?.fileId === props.currentMessage?.fileId;
        return (
          <Message
            {...props}
            key={key}
            renderLeftIcon={<Info />}
            renderRightIcon={<Reply />}
            onLeftSwipeOpen={onLeftSwipe}
            onRightSwipeOpen={setReplyMessage as (message: IMessage) => void}
            swipeableProps={{
              friction: 3,
              overshootFriction: 8,
              activeOffsetX: [-30, 30],
              failOffsetY: [-30, 30],
              rightThreshold: 40,
              leftThreshold: 20,
              enabled: enabled,
            }}
            shouldUpdateMessage={(_, __) => isSelected}
            containerStyle={
              isSelected
                ? {
                    left: { backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100] },
                    right: {
                      backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100],
                    },
                  }
                : undefined
            }
            isSelected={isSelected}
          />
        );
      },
      [onLeftSwipe, selectedMessage, setReplyMessage, isDarkMode]
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

    /* UseEffects */

    // Fetch draftmessage only once when the component mounts
    useEffect(() => {
      (async () => {
        const draft = await getDraftMessage();
        if (!draft) return;
        setdraftMessage(draft);
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const listener = Keyboard.addListener('keyboardDidShow', () => {
        if (bottomContainerVisible) setBottomContainerVisible(false);
      });
      return () => listener.remove();
    }, [bottomContainerVisible]);

    useEffect(() => {
      if (replyMessage !== null && textRef.current) {
        textRef.current?.focus();
      }
    }, [textRef, replyMessage]);

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
