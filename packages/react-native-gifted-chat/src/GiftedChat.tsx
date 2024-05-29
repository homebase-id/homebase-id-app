import {
  ActionSheetOptions,
  ActionSheetProvider,
  ActionSheetProviderRef,
} from '@expo/react-native-action-sheet';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import PropTypes from 'prop-types';
import React, {
  createRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  FlatList,
  GestureResponderEvent,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LightboxProps } from 'react-native-lightbox-v2';
import uuid from 'uuid';
import { Actions, ActionsProps } from './Actions';
import { Avatar, AvatarProps } from './Avatar';
import Bubble from './Bubble';
import { Composer, ComposerProps } from './Composer';
import { MAX_COMPOSER_HEIGHT, MIN_COMPOSER_HEIGHT, TEST_ID } from './Constant';
import { Day, DayProps } from './Day';
import GiftedAvatar from './GiftedAvatar';
import { GiftedChatContext } from './GiftedChatContext';
import { InputToolbar, InputToolbarProps } from './InputToolbar';
import { LoadEarlier, LoadEarlierProps } from './LoadEarlier';
import Message from './Message';
import MessageContainer from './MessageContainer';
import { MessageImage, MessageImageProps } from './MessageImage';
import { MessageText, MessageTextProps } from './MessageText';
import {
  IMessage,
  LeftRightStyle,
  MessageAudioProps,
  MessageVideoProps,
  Reply,
  User,
} from './Models';
import { QuickRepliesProps } from './QuickReplies';
import { Send, SendProps } from './Send';
import { SystemMessage, SystemMessageProps } from './SystemMessage';
import { Time, TimeProps } from './Time';
import * as utils from './utils';
import {
  PasteInputProps,
  PasteInputRef,
} from '@mattermost/react-native-paste-input';

dayjs.extend(localizedFormat);

export interface GiftedChatProps<TMessage extends IMessage = IMessage> {
  /* Message container ref */
  messageContainerRef?: React.RefObject<FlatList<IMessage>>;
  /* text input ref */
  textInputRef?: React.RefObject<TextInput>;
  /* Messages to display */
  messages?: TMessage[];
  /* Typing Indicator state */
  isTyping?: boolean;
  /* Messages container style */
  messagesContainerStyle?: StyleProp<ViewStyle>;
  /* defaultValue; default is undefined, but if specified, it will override GiftedChat's internal state */
  defaultValue?: string;
  /* Controls whether or not the message bubbles appear at the top of the chat */
  alignTop?: boolean;
  /* enables the scrollToBottom Component */
  scrollToBottom?: boolean;
  /* Scroll to bottom wrapper style */
  scrollToBottomStyle?: StyleProp<ViewStyle>;
  initialText?: string;
  /* Placeholder when text is empty; default is 'Type a message...' */
  placeholder?: string;
  /* Makes the composer not editable*/
  disableComposer?: boolean;
  /* User sending the messages: { _id, name, avatar } */
  user?: User;
  /*  Locale to localize the dates */
  locale?: string;
  /* Format to use for rendering times; default is 'LT' */
  timeFormat?: string;
  /* Format to use for rendering dates; default is 'll' */
  dateFormat?: string;
  /* Enables the "Load earlier messages" button */
  loadEarlier?: boolean;
  /*Display an ActivityIndicator when loading earlier messages*/
  isLoadingEarlier?: boolean;
  /* Whether to render an avatar for the current user; default is false, only show avatars for other users */
  showUserAvatar?: boolean;
  /* When false, avatars will only be displayed when a consecutive message is from the same user on the same day; default is false */
  showAvatarForEveryMessage?: boolean;
  /* Render the message avatar at the top of consecutive messages, rather than the bottom; default is false */
  isKeyboardInternallyHandled?: boolean;
  /* Determine whether to handle keyboard awareness inside the plugin. If you have your own keyboard handling outside the plugin set this to false; default is true */
  renderAvatarOnTop?: boolean;
  inverted?: boolean;
  /* Extra props to be passed to the <Image> component created by the default renderMessageImage */
  imageProps?: Message<TMessage>['props'];
  /*Extra props to be passed to the MessageImage's Lightbox */
  lightboxProps?: LightboxProps;
  /*Distance of the chat from the bottom of the screen (e.g. useful if you display a tab bar) */
  bottomOffset?: number;
  /* Minimum height of the input toolbar; default is 44 */
  minInputToolbarHeight?: number;
  /*Extra props to be passed to the messages <ListView>; some props can't be overridden, see the code in MessageContainer.render() for details */
  listViewProps?: any;
  /*  Extra props to be passed to the <TextInput> */
  textInputProps?: any;
  /*Determines whether the keyboard should stay visible after a tap; see <ScrollView> docs */
  keyboardShouldPersistTaps?: any;
  /*Max message composer TextInput length */
  maxInputLength?: number;
  /* Force getting keyboard height to fix some display issues */
  forceGetKeyboardHeight?: boolean;
  /* Force send button */
  alwaysShowSend?: boolean;
  /* Image style */
  imageStyle?: StyleProp<ViewStyle>;
  /* This can be used to pass any data which needs to be re-rendered */
  extraData?: any;
  /* composer min Height */
  minComposerHeight?: number;
  /* composer min Height */
  maxComposerHeight?: number;
  options?: { [key: string]: any };
  optionTintColor?: string;
  quickReplyStyle?: StyleProp<ViewStyle>;
  quickReplyTextStyle?: StyleProp<TextStyle>;
  /* optional prop used to place customView below text, image and video views; default is false */
  isCustomViewBottom?: boolean;
  /* infinite scroll up when reach the top of messages container, automatically call onLoadEarlier function if exist */
  infiniteScroll?: boolean;
  timeTextStyle?: LeftRightStyle<TextStyle>;
  /* Custom action sheet */
  actionSheet?(): {
    showActionSheetWithOptions: (
      options: ActionSheetOptions,
      callback: (i: number) => void,
    ) => void;
  };
  /* Callback when a message avatar is tapped */
  onPressAvatar?(user: User): void;
  /* Callback when a message avatar is tapped */
  onLongPressAvatar?(user: User): void;
  /* Generate an id for new messages. Defaults to UUID v4, generated by uuid */
  messageIdGenerator?(message?: TMessage): string;
  /* Callback when sending a message */
  onSend?(messages: TMessage[]): void;
  /*Callback when loading earlier messages*/
  onLoadEarlier?(): void;
  /* Custom "Load earlier messages" button */
  renderLoadEarlier?(props: LoadEarlierProps): React.ReactNode;
  /* Custom message avatar; set to null to not render any avatar for the message */
  renderAvatar?: null | ((props: AvatarProps<TMessage>) => React.ReactNode);
  /* Custom message bubble */
  renderBubble?(props: Bubble<TMessage>['props']): React.ReactNode;
  /*Custom system message */
  renderSystemMessage?(props: SystemMessageProps<TMessage>): React.ReactNode;
  /* Callback when a message bubble is pressed; default is to do nothing */
  onPress?(context: any, message: TMessage): void;
  /* Callback when a message bubble is long-pressed; default is to show an ActionSheet with "Copy Text" (see example using showActionSheetWithOptions()) */
  onLongPress?(e: GestureResponderEvent, context: any, message: TMessage): void;
  /*Custom Username container */
  renderUsername?(user: User): React.ReactNode;
  /* Reverses display order of messages; default is true */
  /*Custom message container */
  renderMessage?(message: Message<TMessage>['props']): React.ReactNode;
  /* Custom message text */
  renderMessageText?(messageText: MessageTextProps<TMessage>): React.ReactNode;
  /* Custom message image */
  renderMessageImage?(props: MessageImageProps<TMessage>): React.ReactNode;
  /* Custom message video */
  renderMessageVideo?(props: MessageVideoProps<TMessage>): React.ReactNode;
  /* Custom message video */
  renderMessageAudio?(props: MessageAudioProps<TMessage>): React.ReactNode;
  /* Custom view inside the bubble */
  renderCustomView?(props: Bubble<TMessage>['props']): React.ReactNode;
  /*Custom day above a message*/
  renderDay?(props: DayProps<TMessage>): React.ReactNode;
  /* Custom time inside a message */
  renderTime?(props: TimeProps<TMessage>): React.ReactNode;
  /* Custom footer component on the ListView, e.g. 'User is typing...' */
  renderFooter?(): React.ReactNode;
  /* Custom component to render in the ListView when messages are empty */
  renderChatEmpty?(): React.ReactNode;
  /* Custom component to render below the MessageContainer (separate from the ListView) */
  renderChatFooter?(): React.ReactNode;
  /* Custom message composer container */
  renderInputToolbar?(props: InputToolbarProps<TMessage>): React.ReactNode;
  /*  Custom text input message composer */
  renderComposer?(props: ComposerProps): React.ReactNode;
  /* Custom action button on the left of the message composer */
  renderActions?(props: ActionsProps): React.ReactNode;
  /* Custom send button; you can pass children to the original Send component quite easily, for example to use a custom icon (example) */
  renderSend?(props: SendProps<TMessage>): React.ReactNode;
  /*Custom second line of actions below the message composer */
  renderAccessory?(props: InputToolbarProps<TMessage>): React.ReactNode;
  /*Callback when the Action button is pressed (if set, the default actionSheet will not be used) */
  onPressActionButton?(): void;
  /* Callback when the input text changes */
  onInputTextChanged?(text: string): void;
  /* Custom parse patterns for react-native-parsed-text used to linking message content (like URLs and phone numbers) */
  parsePatterns?(linkStyle: TextStyle): any;
  onQuickReply?(replies: Reply[]): void;
  renderQuickReplies?(
    quickReplies: QuickRepliesProps<TMessage>,
  ): React.ReactNode;
  renderQuickReplySend?(): React.ReactNode;
  /* Scroll to bottom custom component */
  scrollToBottomComponent?(): React.ReactNode;
  shouldUpdateMessage?(
    props: Message<TMessage>['props'],
    nextProps: Message<TMessage>['props'],
  ): boolean;
  onPaste: PasteInputProps['onPaste'];
}

const isDebug = false;

function GiftedChat<TMessage extends IMessage = IMessage>(
  props: GiftedChatProps,
) {
  const {
    messages = [],
    initialText = '',
    isTyping,
    messageIdGenerator = () => uuid.v4(),
    user = {},
    onSend = () => {},
    locale = 'en',
    actionSheet = null,
    textInputProps = {},
    renderChatFooter = null,
    renderInputToolbar = null,
    renderAccessory = null,
    isKeyboardInternallyHandled = true,
    bottomOffset = null,
    minInputToolbarHeight = 44,
    keyboardShouldPersistTaps = Platform.select({
      ios: 'never',
      android: 'always',
      default: 'never',
    }),
    onInputTextChanged = null,
    maxInputLength = null,
    forceGetKeyboardHeight = false,
    inverted = true,
    minComposerHeight = MIN_COMPOSER_HEIGHT,
    maxComposerHeight = MAX_COMPOSER_HEIGHT,
    messageContainerRef = createRef<FlatList<IMessage>>(),
    textInputRef = createRef<PasteInputRef>(),
    onPaste = null,
  } = props;

  const keyboardHeightRef = useRef(0);
  const bottomOffsetRef = useRef(0);
  const maxHeightRef = useRef<number | undefined>(undefined);
  const isFirstLayoutRef = useRef(true);
  const actionSheetRef = useRef<ActionSheetProviderRef>(null);

  let _isTextInputWasFocused: boolean = false;

  const [isInitialized, setIsInitialized] = useState(false);
  const [text, setText] = useState<string | undefined>(undefined);

  const [messagesContainerHeight, setMessagesContainerHeight] = useState<
    number | Animated.Value | undefined
  >(undefined);
  const [_composerHeight, setComposerHeight] = useState<number | undefined>(
    minComposerHeight,
  );
  const [typingDisabled, setTypingDisabled] = useState(false);

  const getKeyboardHeight = () => {
    isDebug && console.log('getKeyboardHeight');
    if (Platform.OS === 'android' && !forceGetKeyboardHeight) {
      // For android: on-screen keyboard resized main container and has own height.
      // @see https://developer.android.com/training/keyboard-input/visibility.html
      // So for calculate the messages container height ignore keyboard height.
      return 0;
    }
    // Keyboard Height - 336

    return keyboardHeightRef.current;
  };

  const calculateInputToolbarHeight = useCallback(
    (composerHeight: number) => {
      const getMinInputToolbarHeight = renderAccessory
        ? minInputToolbarHeight! * 2
        : minInputToolbarHeight;

      return composerHeight + (getMinInputToolbarHeight! - minComposerHeight!);
    },
    [minInputToolbarHeight, minComposerHeight],
  );

  /**
   * Returns the height, based on current window size, without taking the keyboard into account.
   */
  const getBasicMessagesContainerHeight = useCallback(
    (composerHeight = _composerHeight) => {
      isDebug &&
        console.log(
          'getBasicMessagesContainerHeight',
          maxHeightRef.current,
          composerHeight,
        );
      return (
        maxHeightRef.current! - calculateInputToolbarHeight(composerHeight!)
      );
    },
    [],
  );

  /**
   * Returns the height, based on current window size, taking the keyboard into account.
   */
  const getMessagesContainerHeightWithKeyboard = useCallback(
    (composerHeight = _composerHeight) => {
      isDebug && console.log('getMessagesContainerHeightWithKeyboard');
      return (
        getBasicMessagesContainerHeight(composerHeight) -
        getKeyboardHeight() +
        bottomOffsetRef.current
      );
    },
    [getBasicMessagesContainerHeight, getKeyboardHeight],
  );

  /**
   * Store text input focus status when keyboard hide to retrieve
   * it after wards if needed.
   * `onKeyboardWillHide` may be called twice in sequence so we
   * make a guard condition (eg. showing image picker)
   */
  const handleTextInputFocusWhenKeyboardHide = () => {
    isDebug && console.log('handleTextInputFocusWhenKeyboardHide');
    if (!_isTextInputWasFocused) {
      _isTextInputWasFocused = textInputRef.current?.isFocused() || false;
    }
  };

  /**
   * Refocus the text input only if it was focused before showing keyboard.
   * This is needed in some cases (eg. showing image picker).
   */
  const handleTextInputFocusWhenKeyboardShow = () => {
    isDebug && console.log('handleTextInputFocusWhenKeyboardShow');
    if (
      textInputRef.current &&
      _isTextInputWasFocused &&
      !textInputRef.current.isFocused()
    ) {
      textInputRef.current.focus();
    }

    // Reset the indicator since the keyboard is shown
    _isTextInputWasFocused = false;
  };

  const onKeyboardWillShow = (e: any) => {
    isDebug && console.log('onKeyboardWillShow');
    handleTextInputFocusWhenKeyboardShow();

    if (isKeyboardInternallyHandled) {
      keyboardHeightRef.current = e.endCoordinates
        ? e.endCoordinates.height
        : e.end.height;

      bottomOffsetRef.current = bottomOffset != null ? bottomOffset : 1;

      const newMessagesContainerHeight = getMessagesContainerHeightWithKeyboard();
      setMessagesContainerHeight(newMessagesContainerHeight);
      setTypingDisabled(true);
    }
  };

  const onKeyboardWillHide = (_e: any) => {
    isDebug && console.log('onKeyboardWillHide');
    handleTextInputFocusWhenKeyboardHide();

    if (isKeyboardInternallyHandled) {
      keyboardHeightRef.current = 0;
      bottomOffsetRef.current = 0;

      const newMessagesContainerHeight = getBasicMessagesContainerHeight();
      setMessagesContainerHeight(newMessagesContainerHeight);
      setTypingDisabled(true);
    }
  };

  const onKeyboardDidShow = (e: any) => {
    isDebug && console.log('onKeyboardDidShow');
    if (Platform.OS === 'android') {
      onKeyboardWillShow(e);
    }

    setTypingDisabled(false);
  };

  const onKeyboardDidHide = (e: any) => {
    isDebug && console.log('onKeyboardDidHide');
    if (Platform.OS === 'android') {
      onKeyboardWillHide(e);
    }

    setTypingDisabled(false);
  };

  const RenderedMessages = useMemo(() => {
    isDebug && console.log('renderMessages', messagesContainerHeight);
    const { messagesContainerStyle, ...messagesContainerProps } = props;

    const fragment = (
      <View
        style={[
          Platform.OS === 'android'
            ? { height: 'auto', flexGrow: 1 }
            : typeof messagesContainerHeight === 'number' && {
                height: messagesContainerHeight,
              },
          messagesContainerStyle,
        ]}
      >
        <MessageContainer
          {...messagesContainerProps}
          invertibleScrollViewProps={{
            inverted: inverted,
            keyboardShouldPersistTaps: keyboardShouldPersistTaps,
            onKeyboardWillShow: onKeyboardWillShow,
            onKeyboardWillHide: onKeyboardWillHide,
            onKeyboardDidShow: onKeyboardDidShow,
            onKeyboardDidHide: onKeyboardDidHide,
          }}
          messages={messages}
          forwardRef={messageContainerRef}
          isTyping={isTyping}
        />
        {renderChatFooter && renderChatFooter()}
      </View>
    );

    return isKeyboardInternallyHandled ? (
      <KeyboardAvoidingView
        enabled
        style={
          Platform.OS === 'android'
            ? { height: 'auto', flexGrow: 1 }
            : undefined
        }
      >
        {fragment}
      </KeyboardAvoidingView>
    ) : (
      fragment
    );
  }, [messages, props, messagesContainerHeight]);

  const _onSend = (
    messages: TMessage[] = [],
    shouldResetInputToolbar = false,
  ) => {
    isDebug && console.log('_onSend');
    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    const newMessages: TMessage[] = messages.map(message => {
      return {
        ...message,
        user: user!,
        createdAt: new Date(),
        _id: messageIdGenerator && messageIdGenerator(),
      };
    });

    if (shouldResetInputToolbar === true) {
      // setTypingDisabled(true); => Breaks directly typing after sending a message
      resetInputToolbar();
    }

    if (onSend) {
      onSend(newMessages);
    }
  };

  const resetInputToolbar: () => void = () => {
    isDebug && console.log('resetInputToolbar');
    if (textInputRef.current) {
      textInputRef.current.clear();
    }

    notifyInputTextReset();

    const newMessagesContainerHeight = getMessagesContainerHeightWithKeyboard(
      minComposerHeight,
    );
    setMessagesContainerHeight(newMessagesContainerHeight);

    setText(initialText);
    setComposerHeight(minComposerHeight);
  };

  const onInputSizeChanged = useCallback(
    (size: { height: number }) => {
      isDebug && console.log('onInputSizeChanged', size.height);
      const newComposerHeight = Math.max(
        minComposerHeight!,
        Math.min(maxComposerHeight!, size.height),
      );
      // Return early if the height is not changed
      if (_composerHeight === newComposerHeight) return;

      const newMessagesContainerHeight = getMessagesContainerHeightWithKeyboard(
        newComposerHeight!,
      );
      setMessagesContainerHeight(newMessagesContainerHeight);
      setComposerHeight(newComposerHeight);
    },
    [
      minComposerHeight,
      maxComposerHeight,
      getMessagesContainerHeightWithKeyboard,
    ],
  );

  const _onInputTextChanged = useCallback(
    (_text: string) => {
      isDebug && console.log('_onInputTextChanged');
      if (typingDisabled) return;

      if (onInputTextChanged) {
        onInputTextChanged(_text);
      }
      setText(_text);
    },
    [typingDisabled, text, onInputTextChanged],
  );

  const notifyInputTextReset = useCallback(() => {
    isDebug && console.log('notifyInputTextReset');
    if (onInputTextChanged) {
      onInputTextChanged('');
    }
  }, [onInputTextChanged]);

  const onInitialLayoutViewLayout = useCallback(
    (e: any) => {
      isDebug && console.log('onInitialLayoutViewLayout');
      const { layout } = e.nativeEvent;

      if (layout.height <= 0) {
        return;
      }

      // notifyInputTextReset(); // Unnecessary on initial load
      maxHeightRef.current = layout.height;

      const newMessagesContainerHeight = getMessagesContainerHeightWithKeyboard(
        minComposerHeight,
      );
      setMessagesContainerHeight(newMessagesContainerHeight);

      setIsInitialized(true);
      setText(text || initialText);
      setComposerHeight(minComposerHeight);
    },
    [
      initialText,
      notifyInputTextReset,
      getMessagesContainerHeightWithKeyboard,
      setMessagesContainerHeight,
      setIsInitialized,
      setText,
      text,
      setComposerHeight,
      minComposerHeight,
    ],
  );

  const onMainViewLayout = useCallback(
    (e: LayoutChangeEvent) => {
      isDebug && console.log('onMainViewLayout', e.nativeEvent.layout.height);
      // TODO: fix an issue when keyboard is dismissing during the initialization
      const { layout } = e.nativeEvent;

      if (
        maxHeightRef.current !== layout.height ||
        isFirstLayoutRef.current === true
      ) {
        maxHeightRef.current = layout.height;

        setMessagesContainerHeight(
          keyboardHeightRef.current > 0
            ? getMessagesContainerHeightWithKeyboard()
            : getBasicMessagesContainerHeight(),
        );
      }

      if (isFirstLayoutRef.current === true) {
        isFirstLayoutRef.current = false;
      }
    },
    [
      setMessagesContainerHeight,
      getMessagesContainerHeightWithKeyboard,
      getBasicMessagesContainerHeight,
    ],
  );

  const inputToolbarProps = useMemo(
    () => ({
      ...props,
      composerHeight: Math.max(minComposerHeight!, _composerHeight!),
      onSend: _onSend,
      onInputSizeChanged: onInputSizeChanged,
      onTextChanged: _onInputTextChanged,
      textInputProps: {
        ...textInputProps,
        ref: textInputRef,
        maxLength: typingDisabled ? 0 : maxInputLength,
      },
      onPaste,
    }),
    [props, _composerHeight, typingDisabled],
  );

  const contextValues = useMemo(
    () => ({
      actionSheet: actionSheet || (() => actionSheetRef.current?.getContext()!),
      getLocale: () => locale,
    }),
    [actionSheet, locale],
  );

  if (isInitialized) {
    isDebug && console.log('GiftedChat initialized');
    return (
      <GiftedChatContext.Provider value={contextValues}>
        <View testID={TEST_ID.WRAPPER} style={styles.wrapper}>
          <ActionSheetProvider ref={actionSheetRef}>
            <View onLayout={onMainViewLayout} style={styles.container}>
              {RenderedMessages}
              {renderInputToolbar ? (
                renderInputToolbar({ ...inputToolbarProps, text })
              ) : (
                <InputToolbar {...inputToolbarProps} text={text} />
              )}
            </View>
          </ActionSheetProvider>
        </View>
      </GiftedChatContext.Provider>
    );
  }

  isDebug && console.log('GiftedChat');
  return (
    <View
      testID={TEST_ID.LOADING_WRAPPER}
      style={styles.container}
      onLayout={onInitialLayoutViewLayout}
    />
  );
}

GiftedChat.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object),
  messagesContainerStyle: utils.StylePropType,
  text: PropTypes.string,
  initialText: PropTypes.string,
  placeholder: PropTypes.string,
  disableComposer: PropTypes.bool,
  messageIdGenerator: PropTypes.func,
  user: PropTypes.object,
  onSend: PropTypes.func,
  locale: PropTypes.string,
  timeFormat: PropTypes.string,
  dateFormat: PropTypes.string,
  isKeyboardInternallyHandled: PropTypes.bool,
  loadEarlier: PropTypes.bool,
  onLoadEarlier: PropTypes.func,
  isLoadingEarlier: PropTypes.bool,
  renderLoadEarlier: PropTypes.func,
  renderAvatar: PropTypes.func,
  showUserAvatar: PropTypes.bool,
  actionSheet: PropTypes.func,
  onPressAvatar: PropTypes.func,
  onLongPressAvatar: PropTypes.func,
  renderUsernameOnMessage: PropTypes.bool,
  renderAvatarOnTop: PropTypes.bool,
  isCustomViewBottom: PropTypes.bool,
  renderBubble: PropTypes.func,
  renderSystemMessage: PropTypes.func,
  onLongPress: PropTypes.func,
  renderMessage: PropTypes.func,
  renderMessageText: PropTypes.func,
  renderMessageImage: PropTypes.func,
  imageProps: PropTypes.object,
  videoProps: PropTypes.object,
  audioProps: PropTypes.object,
  lightboxProps: PropTypes.object,
  renderCustomView: PropTypes.func,
  renderDay: PropTypes.func,
  renderTime: PropTypes.func,
  renderFooter: PropTypes.func,
  renderChatEmpty: PropTypes.func,
  renderChatFooter: PropTypes.func,
  renderInputToolbar: PropTypes.func,
  renderComposer: PropTypes.func,
  renderActions: PropTypes.func,
  renderSend: PropTypes.func,
  renderAccessory: PropTypes.func,
  onPressActionButton: PropTypes.func,
  bottomOffset: PropTypes.number,
  minInputToolbarHeight: PropTypes.number,
  listViewProps: PropTypes.object,
  keyboardShouldPersistTaps: PropTypes.oneOf(['always', 'never', 'handled']),
  onInputTextChanged: PropTypes.func,
  maxInputLength: PropTypes.number,
  forceGetKeyboardHeight: PropTypes.bool,
  inverted: PropTypes.bool,
  textInputProps: PropTypes.object,
  extraData: PropTypes.object,
  minComposerHeight: PropTypes.number,
  maxComposerHeight: PropTypes.number,
  alignTop: PropTypes.bool,
};

GiftedChat.append = <TMessage extends IMessage>(
  currentMessages: TMessage[] = [],
  messages: TMessage[],
  inverted = true,
) => {
  if (!Array.isArray(messages)) {
    messages = [messages];
  }
  return inverted
    ? messages.concat(currentMessages)
    : currentMessages.concat(messages);
};

GiftedChat.prepend = <TMessage extends IMessage>(
  currentMessages: TMessage[] = [],
  messages: TMessage[],
  inverted = true,
) => {
  if (!Array.isArray(messages)) {
    messages = [messages];
  }
  return inverted
    ? currentMessages.concat(messages)
    : messages.concat(currentMessages);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
});

export * from './Models';
export {
  GiftedChat,
  Actions,
  Avatar,
  Bubble,
  SystemMessage,
  MessageImage,
  MessageText,
  Composer,
  Day,
  InputToolbar,
  LoadEarlier,
  Message,
  MessageContainer,
  Send,
  Time,
  GiftedAvatar,
  utils,
};
