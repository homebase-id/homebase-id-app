import React, { memo, useCallback, useRef } from 'react';
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native';

import { Avatar, AvatarProps } from './Avatar';
import Bubble, { BubbleProps } from './Bubble';
import { SystemMessage, SystemMessageProps } from './SystemMessage';
import { DayProps } from './Day';

import { isSameDay, isSameUser } from './utils';
import { IMessage, User, LeftRightStyle } from './Models';
import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import ReanimatedSwipeable, {
  SwipeableProps,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

const styles = {
  left: StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
      marginLeft: 8,
      marginRight: 0,
    },
  }),
  right: StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      marginLeft: 0,
      marginRight: 8,
    },
  }),
  container: {
    width: 40,
  },
  iconWrapper: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  replyImage: {
    width: 20,
    height: 20,
  },
  defaultBottomOffset: {
    marginBottom: 2,
  },
  bottomOffsetNext: {
    marginBottom: 10,
  },
  leftOffsetValue: {
    marginLeft: 16,
  },
};

export interface MessageProps<TMessage extends IMessage> {
  showUserAvatar?: boolean;
  position: 'left' | 'right';
  currentMessage: TMessage;
  nextMessage?: TMessage;
  previousMessage?: TMessage;
  user: User;
  inverted?: boolean;
  containerStyle?: LeftRightStyle<ViewStyle>;
  renderBubble?(props: BubbleProps<TMessage>): React.ReactNode;
  renderDay?(props: DayProps): React.ReactNode;
  renderSystemMessage?(props: SystemMessageProps<TMessage>): React.ReactNode;
  renderAvatar?(props: AvatarProps<TMessage>): React.ReactNode;
  shouldUpdateMessage?(
    props: MessageProps<IMessage>,
    nextProps: MessageProps<IMessage>,
  ): boolean;
  onMessageLayout?(event: LayoutChangeEvent): void;
  onRightSwipeOpen?(message: TMessage): void;
  onLeftSwipeOpen?(message: TMessage): void;
  renderLeftIcon?: React.ReactNode;
  renderRightIcon?: React.ReactNode;
  swipeableProps?: SwipeableProps;
  isSelected?: boolean;
}

let Message: React.FC<MessageProps<IMessage>> = (
  props: MessageProps<IMessage>,
) => {
  const {
    currentMessage,
    renderBubble: renderBubbleProp,
    renderSystemMessage: renderSystemMessageProp,
    renderAvatar: renderAvatarProp,
    onMessageLayout,
    nextMessage,
    position,
    containerStyle,
    user,
    showUserAvatar,
    onRightSwipeOpen,
    onLeftSwipeOpen,
    renderLeftIcon,
    renderRightIcon,
    swipeableProps,
  } = props;

  const swipeableRef = useRef<any>(null);

  const renderBubble = useCallback(() => {
    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      containerStyle,
      onMessageLayout,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...rest
    } = props;

    if (renderBubbleProp) return renderBubbleProp(rest);

    return <Bubble {...rest} />;
  }, [props, renderBubbleProp]);

  const renderSystemMessage = useCallback(() => {
    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      containerStyle,
      onMessageLayout,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...rest
    } = props;

    if (renderSystemMessageProp) return renderSystemMessageProp(rest);

    return <SystemMessage {...rest} />;
  }, [props, renderSystemMessageProp]);

  const renderAvatar = useCallback(() => {
    if (
      user?._id &&
      currentMessage?.user &&
      user._id === currentMessage.user._id &&
      !showUserAvatar
    )
      return null;

    if (currentMessage?.user?.avatar === null) return null;

    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      containerStyle,
      onMessageLayout,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...rest
    } = props;

    if (renderAvatarProp) return renderAvatarProp(rest);

    return <Avatar {...rest} />;
  }, [props, user, currentMessage, showUserAvatar, renderAvatarProp]);

  const isNextMyMessage =
    currentMessage &&
    nextMessage &&
    isSameUser(currentMessage, nextMessage) &&
    isSameDay(currentMessage, nextMessage);

  const renderRightAction = useCallback(
    (progressAnimatedValue: SharedValue<number>) => {
      const animatedStyles = useAnimatedStyle(() => {
        const size = interpolate(
          progressAnimatedValue.value,
          [0, 1, 100],
          [0, 1, 1],
        );
        const trans = interpolate(
          progressAnimatedValue.value,
          [0, 1, 2],
          [0, -12, -20],
        );
        return {
          transform: [{ scale: size }, { translateX: trans }],
        };
      });

      return (
        <Animated.View
          style={[
            styles.container,
            isNextMyMessage
              ? styles.defaultBottomOffset
              : styles.bottomOffsetNext,
            position === 'right' && styles.leftOffsetValue,
            animatedStyles,
          ]}
        >
          <View style={styles.iconWrapper}>{renderLeftIcon}</View>
        </Animated.View>
      );
    },
    [renderLeftIcon, isNextMyMessage, position],
  );

  const renderLeftAction = useCallback(
    (progressAnimatedValue: SharedValue<number>) => {
      const animatedStyles = useAnimatedStyle(() => {
        const size = interpolate(
          progressAnimatedValue.value,
          [0, 1, 100],
          [0, 1, 1],
        );
        const trans = interpolate(
          progressAnimatedValue.value,
          [0, 1, 2],
          [0, -12, -20],
        );
        return {
          transform: [{ scale: size }, { translateX: trans }],
        };
      });

      return (
        <Animated.View
          style={[
            styles.container,
            isNextMyMessage
              ? styles.defaultBottomOffset
              : styles.bottomOffsetNext,
            position === 'right' && styles.leftOffsetValue,
            animatedStyles,
          ]}
        >
          <View style={styles.iconWrapper}>{renderRightIcon}</View>
        </Animated.View>
      );
    },
    [renderRightIcon, isNextMyMessage, position],
  );

  const onSwipeOpenAction = useCallback(
    (direction: 'left' | 'right') => {
      ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.impactMedium, {
        enableVibrateFallback: true,
      });
      if (currentMessage && direction === 'left') {
        onLeftSwipeOpen?.({ ...currentMessage });
        swipeableRef.current?.close();
      } else {
        currentMessage && onRightSwipeOpen?.({ ...currentMessage });
        swipeableRef.current?.close();
      }
    },
    [currentMessage, onLeftSwipeOpen, onRightSwipeOpen],
  );

  if (!currentMessage) return null;

  const sameUser = isSameUser(currentMessage, nextMessage!);

  return (
    <View onLayout={onMessageLayout}>
      {currentMessage.system ? (
        renderSystemMessage()
      ) : (
        <View
          style={[
            styles[position].container,
            { marginBottom: sameUser ? 2 : 10 },
            !props.inverted && { marginBottom: 2 },
            containerStyle?.[position],
          ]}
        >
          {position === 'left' ? renderAvatar() : null}
          <ReanimatedSwipeable
            ref={swipeableRef}
            renderRightActions={renderRightAction}
            renderLeftActions={renderLeftAction}
            onSwipeableOpen={onSwipeOpenAction}
            {...swipeableProps}
          >
            {renderBubble()}
          </ReanimatedSwipeable>
          {position === 'right' ? renderAvatar() : null}
        </View>
      )}
    </View>
  );
};

Message = memo(Message, (props, nextProps) => {
  const shouldUpdate =
    props.shouldUpdateMessage?.(props, nextProps) ||
    props.currentMessage !== nextProps.currentMessage ||
    props.previousMessage !== nextProps.previousMessage ||
    props.nextMessage !== nextProps.nextMessage;

  if (shouldUpdate) return false;

  return true;
});

export default Message;
