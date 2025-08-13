import React, {
  createRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  RefObject,
} from 'react';
import {
  ActionSheetOptions,
  ActionSheetProvider,
  ActionSheetProviderRef,
} from '@expo/react-native-action-sheet';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import {
  FlatList,
  Platform,
  TextInput,
  View,
  LayoutChangeEvent,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LightboxProps } from 'react-native-lightbox-v2';
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
import Message, { MessageProps } from './Message';
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
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import {
  KeyboardProvider,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import { AnimatedList } from './types';

dayjs.extend(localizedFormat);

export interface GiftedChatProps<TMessage extends IMessage = IMessage> {
  /* Message container ref */
  messageContainerRef?: React.RefObject<FlatList<IMessage> | null>;
  /* text input ref */
  textInputRef?: React.RefObject<TextInput | null>;
  /* Messages to display */
  messages?: TMessage[];
  /* Typing Indicator state */
  isTyping?: boolean;
  /* Messages container style */
  messagesContainerStyle?: StyleProp<ViewStyle>;
  /* Input text; default is undefined, but if specified, it will override GiftedChat's internal state */
  text?: string;
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
  imageProps?: MessageImageProps<TMessage>;
  /*Extra props to be passed to the MessageImage's Lightbox */
  lightboxProps?: LightboxProps;
  /*Distance of the chat from the bottom of the screen (e.g. useful if you display a tab bar) */
  bottomOffset?: number;
  /* Focus on <TextInput> automatically when opening the keyboard; default is true */
  focusOnInputWhenOpeningKeyboard?: boolean;
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
  /*  Render a loading view when initializing */
  renderLoading?(): React.ReactNode;
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
  onLongPress?(
    coords: {
      x: number;
      y: number;
      absoluteX: number;
      absoluteY: number;
    },
    context: any,
    message: TMessage,
  ): void;
  /*Custom Username container */
  renderUsername?(user: User): React.ReactNode;
  /* Reverses display order of messages; default is true */
  /*Custom message container */
  renderMessage?(message: MessageProps<TMessage>): React.ReactNode;
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
  renderDay?(props: DayProps): React.ReactNode;
  /* Custom time inside a message */
  renderTime?(props: TimeProps<TMessage>): React.ReactNode;
  /* Custom footer component on the ListView, e.g. 'User is typing...' */
  renderFooter?(): React.ReactNode;
  /* Custom component to render in the ListView when messages are empty */
  renderChatEmpty?(): React.ReactNode;
  /* Custom component to render below the MessageContainer (separate from the ListView) */
  renderChatFooter?(
    text: string | undefined,
    updateText: React.Dispatch<React.SetStateAction<string | undefined>>,
  ): React.ReactNode;
  /* Custom composer container that render belows */
  renderBottomFooter?: React.ReactNode;
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
    props: MessageProps<TMessage>,
    nextProps: MessageProps<TMessage>,
  ): boolean;
  renderUsernameOnMessage?: boolean;
}

dayjs.extend(localizedFormat);

function GiftedChat<TMessage extends IMessage = IMessage>(
  props: GiftedChatProps<TMessage>,
) {
  const {
    messages = [],
    initialText = '',
    isTyping,

    // "random" function from here: https://stackoverflow.com/a/8084248/3452513
    // we do not use uuid since it would add extra native dependency (https://www.npmjs.com/package/react-native-get-random-values)
    // lib's user can decide which algorithm to use and pass it as a prop
    messageIdGenerator = () => (Math.random() + 1).toString(36).substring(7),

    user = {},
    onSend,
    locale = 'en',
    renderLoading,
    actionSheet = null,
    textInputProps,
    renderChatFooter = null,
    renderInputToolbar = null,
    bottomOffset = 0,
    focusOnInputWhenOpeningKeyboard = true,
    keyboardShouldPersistTaps = Platform.select({
      ios: 'never',
      android: 'always',
      default: 'never',
    }),
    onInputTextChanged = null,
    maxInputLength = null,
    inverted = true,
    minComposerHeight = MIN_COMPOSER_HEIGHT,
    maxComposerHeight = MAX_COMPOSER_HEIGHT,
    isKeyboardInternallyHandled = true,
  } = props;

  const actionSheetRef = useRef<ActionSheetProviderRef>(null);

  const messageContainerRef = useMemo(
    () => props.messageContainerRef || createRef<AnimatedList<TMessage>>(),
    [props.messageContainerRef],
  ) as RefObject<AnimatedList<TMessage>>;

  const textInputRef = useMemo(
    () => props.textInputRef || createRef<TextInput>(),
    [props.textInputRef],
  );

  const isTextInputWasFocused: RefObject<boolean> = useRef(false);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [composerHeight, setComposerHeight] = useState<number>(
    minComposerHeight!,
  );
  const [text, setText] = useState<string | undefined>(() => props.text || '');
  const [isTypingDisabled, setIsTypingDisabled] = useState<boolean>(false);

  const keyboard = useReanimatedKeyboardAnimation();
  const trackingKeyboardMovement = useSharedValue(false);
  const debounceEnableTypingTimeoutId =
    useRef<ReturnType<typeof setTimeout>>(undefined);
  const keyboardOffsetBottom = useSharedValue(0);

  const contentStyleAnim = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: keyboard.height.value - keyboardOffsetBottom.value },
      ],
    };
  }, [keyboard, keyboardOffsetBottom]);

  const getTextFromProp = useCallback(
    (fallback: string) => {
      if (props.text === undefined) return fallback;

      return props.text;
    },
    [props.text],
  );

  /**
   * Store text input focus status when keyboard hide to retrieve
   * it afterwards if needed.
   * `onKeyboardWillHide` may be called twice in sequence so we
   * make a guard condition (eg. showing image picker)
   */
  const handleTextInputFocusWhenKeyboardHide = useCallback(() => {
    if (!isTextInputWasFocused.current)
      isTextInputWasFocused.current =
        textInputRef.current?.isFocused() || false;
  }, [textInputRef]);

  /**
   * Refocus the text input only if it was focused before showing keyboard.
   * This is needed in some cases (eg. showing image picker).
   */
  const handleTextInputFocusWhenKeyboardShow = useCallback(() => {
    if (
      textInputRef.current &&
      isTextInputWasFocused.current &&
      !textInputRef.current.isFocused()
    )
      textInputRef.current.focus();

    // Reset the indicator since the keyboard is shown
    isTextInputWasFocused.current = false;
  }, [textInputRef]);

  const disableTyping = useCallback(() => {
    if (debounceEnableTypingTimeoutId.current) {
      clearTimeout(debounceEnableTypingTimeoutId.current);
    }
    setIsTypingDisabled(true);
  }, []);

  const enableTyping = useCallback(() => {
    if (debounceEnableTypingTimeoutId.current) {
      clearTimeout(debounceEnableTypingTimeoutId.current);
    }
    setIsTypingDisabled(false);
  }, []);

  const debounceEnableTyping = useCallback(() => {
    if (debounceEnableTypingTimeoutId.current) {
      clearTimeout(debounceEnableTypingTimeoutId.current);
    }
    debounceEnableTypingTimeoutId.current = setTimeout(() => {
      enableTyping();
    }, 50);
  }, [enableTyping]);

  const scrollToBottom = useCallback(
    (isAnimated = true) => {
      if (!messageContainerRef?.current) return;

      if (inverted) {
        messageContainerRef.current.scrollToOffset({
          offset: 0,
          animated: isAnimated,
        });
        return;
      }

      messageContainerRef.current.scrollToEnd({ animated: isAnimated });
    },
    [inverted, messageContainerRef],
  );

  const renderMessages = useMemo(() => {
    if (!isInitialized) return null;

    const { messagesContainerStyle, ...messagesContainerProps } = props;

    return (
      <View style={[{ flex: 1 }, messagesContainerStyle]}>
        <MessageContainer<TMessage>
          {...messagesContainerProps}
          invertibleScrollViewProps={{
            inverted,
            keyboardShouldPersistTaps,
          }}
          messages={messages}
          forwardRef={messageContainerRef}
          isTyping={isTyping}
        />
        {renderChatFooter?.(text, setText)}
      </View>
    );
  }, [
    isInitialized,
    isTyping,
    messages,
    props,
    inverted,
    keyboardShouldPersistTaps,
    messageContainerRef,
    renderChatFooter,
  ]);

  const notifyInputTextReset = useCallback(() => {
    onInputTextChanged?.('');
  }, [onInputTextChanged]);

  const resetInputToolbar = useCallback(() => {
    textInputRef.current?.clear();

    notifyInputTextReset();

    setComposerHeight(minComposerHeight!);
    setText(getTextFromProp(''));
    enableTyping();
  }, [
    minComposerHeight,
    getTextFromProp,
    textInputRef,
    notifyInputTextReset,
    enableTyping,
  ]);

  const _onSend = useCallback(
    (messages: TMessage[] = [], shouldResetInputToolbar = false) => {
      if (!Array.isArray(messages)) messages = [messages];

      const newMessages: TMessage[] = messages.map(message => {
        return {
          ...message,
          user: user!,
          createdAt: new Date(),
          _id: messageIdGenerator?.(),
        };
      });

      if (shouldResetInputToolbar === true) {
        disableTyping();

        resetInputToolbar();
      }

      onSend?.(newMessages);

      setTimeout(() => scrollToBottom(), 10);
    },
    [
      messageIdGenerator,
      onSend,
      user,
      resetInputToolbar,
      disableTyping,
      scrollToBottom,
    ],
  );

  const onInputSizeChanged = useCallback(
    (size: { height: number }) => {
      const newComposerHeight = Math.max(
        minComposerHeight!,
        Math.min(maxComposerHeight!, size.height),
      );

      setComposerHeight(newComposerHeight);
    },
    [maxComposerHeight, minComposerHeight],
  );

  const _onInputTextChanged = useCallback(
    (_text: string) => {
      if (isTypingDisabled) return;

      onInputTextChanged?.(_text);

      // Only set state if it's not being overridden by a prop.
      if (props.text === undefined) setText(_text);
    },
    [onInputTextChanged, isTypingDisabled, props.text],
  );

  const onInitialLayoutViewLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (isInitialized) return;

      const { layout } = e.nativeEvent;

      if (layout.height <= 0) return;

      notifyInputTextReset();

      setIsInitialized(true);
      setComposerHeight(minComposerHeight!);
      setText(getTextFromProp(initialText));
    },
    [
      isInitialized,
      initialText,
      minComposerHeight,
      notifyInputTextReset,
      getTextFromProp,
    ],
  );

  const inputToolbarFragment = useMemo(() => {
    if (!isInitialized) return null;

    const inputToolbarProps = {
      ...props,
      text: getTextFromProp(text!),
      composerHeight: Math.max(minComposerHeight!, composerHeight),
      onSend: _onSend,
      onInputSizeChanged,
      onTextChanged: _onInputTextChanged,
      textInputProps: {
        ...textInputProps,
        ref: textInputRef,
        maxLength: isTypingDisabled ? 0 : maxInputLength,
      },
    };

    if (renderInputToolbar) return renderInputToolbar(inputToolbarProps);

    return <InputToolbar {...inputToolbarProps} />;
  }, [
    isInitialized,
    _onSend,
    getTextFromProp,
    maxInputLength,
    minComposerHeight,
    onInputSizeChanged,
    props,
    text,
    renderInputToolbar,
    composerHeight,
    isTypingDisabled,
    textInputRef,
    textInputProps,
    _onInputTextChanged,
  ]);

  const contextValues = useMemo(
    () => ({
      actionSheet:
        actionSheet ||
        (() => ({
          showActionSheetWithOptions:
            actionSheetRef.current!.showActionSheetWithOptions,
        })),
      getLocale: () => locale,
    }),
    [actionSheet, locale],
  );

  useEffect(() => {
    if (props.text != null) setText(props.text);
  }, [props.text]);

  useAnimatedReaction(
    () => -keyboard.height.value,
    (value, prevValue) => {
      if (prevValue !== null && value !== prevValue) {
        const isKeyboardMovingUp = value > prevValue;
        if (isKeyboardMovingUp !== trackingKeyboardMovement.value) {
          trackingKeyboardMovement.value = isKeyboardMovingUp;
          keyboardOffsetBottom.value = withTiming(
            isKeyboardMovingUp ? bottomOffset : 0,
            {
              // If `bottomOffset` exists, we change the duration to a smaller value to fix the delay in the keyboard animation speed
              duration: bottomOffset ? 150 : 400,
            },
          );

          if (focusOnInputWhenOpeningKeyboard)
            if (isKeyboardMovingUp)
              runOnJS(handleTextInputFocusWhenKeyboardShow)();
            else runOnJS(handleTextInputFocusWhenKeyboardHide)();

          if (value === 0) {
            runOnJS(enableTyping)();
          } else {
            runOnJS(disableTyping)();
            runOnJS(debounceEnableTyping)();
          }
        }
      }
    },
    [
      keyboard,
      trackingKeyboardMovement,
      focusOnInputWhenOpeningKeyboard,
      handleTextInputFocusWhenKeyboardHide,
      handleTextInputFocusWhenKeyboardShow,
      enableTyping,
      disableTyping,
      debounceEnableTyping,
      bottomOffset,
    ],
  );

  return (
    <GiftedChatContext.Provider value={contextValues}>
      <ActionSheetProvider ref={actionSheetRef}>
        <View
          testID={TEST_ID.WRAPPER}
          style={[{ flex: 1 }, styles.contentContainer]}
          onLayout={onInitialLayoutViewLayout}
        >
          {isInitialized ? (
            <Animated.View
              style={[
                { flex: 1 },
                isKeyboardInternallyHandled && contentStyleAnim,
              ]}
            >
              {renderMessages}
              {inputToolbarFragment}
              {props.renderBottomFooter}
            </Animated.View>
          ) : (
            renderLoading?.()
          )}
        </View>
      </ActionSheetProvider>
    </GiftedChatContext.Provider>
  );
}

function GiftedChatWrapper<TMessage extends IMessage = IMessage>(
  props: GiftedChatProps<TMessage>,
) {
  return (
    <KeyboardProvider>
      <GiftedChat<TMessage> {...props} />
    </KeyboardProvider>
  );
}

GiftedChatWrapper.append = <TMessage extends IMessage>(
  currentMessages: TMessage[] = [],
  messages: TMessage[],
  inverted = true,
) => {
  if (!Array.isArray(messages)) messages = [messages];

  return inverted
    ? messages.concat(currentMessages)
    : currentMessages.concat(messages);
};

GiftedChatWrapper.prepend = <TMessage extends IMessage>(
  currentMessages: TMessage[] = [],
  messages: TMessage[],
  inverted = true,
) => {
  if (!Array.isArray(messages)) messages = [messages];

  return inverted
    ? currentMessages.concat(messages)
    : messages.concat(currentMessages);
};

export * from './Models';

export {
  GiftedChatWrapper as GiftedChat,
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
  contentContainer: {
    flex: 1,
  },
});
