import PropTypes from 'prop-types';
import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  LayoutChangeEvent,
  Animated,
} from 'react-native';

import { Avatar, AvatarProps } from './Avatar';
import Bubble from './Bubble';
import { SystemMessage, SystemMessageProps } from './SystemMessage';
import { Day, DayProps } from './Day';

import { StylePropType, isSameDay, isSameUser } from './utils';
import { IMessage, User, LeftRightStyle } from './Models';
import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import { Swipeable, SwipeableProps } from 'react-native-gesture-handler';

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
    justifyContent: 'center',
    alignItems: 'center',
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
  key: any;
  showUserAvatar?: boolean;
  position: 'left' | 'right';
  currentMessage?: TMessage;
  nextMessage?: TMessage;
  previousMessage?: TMessage;
  user: User;
  inverted?: boolean;
  containerStyle?: LeftRightStyle<ViewStyle>;
  renderBubble?(props: Bubble['props']): React.ReactNode;
  renderDay?(props: DayProps<TMessage>): React.ReactNode;
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
}

export default class Message<
  TMessage extends IMessage = IMessage
> extends React.Component<MessageProps<TMessage>> {
  static defaultProps = {
    renderAvatar: undefined,
    renderBubble: null,
    renderDay: null,
    renderSystemMessage: null,
    position: 'left',
    currentMessage: {},
    nextMessage: {},
    previousMessage: {},
    user: {},
    containerStyle: {},
    showUserAvatar: false,
    inverted: true,
    shouldUpdateMessage: undefined,
    onMessageLayout: undefined,
    onRightSwipeOpen: () => {},
    onLeftSwipeOpen: () => {},
    renderLeftIcon: undefined,
    renderRightIcon: undefined,
    swipeEnabled: true,
  };

  static propTypes = {
    renderAvatar: PropTypes.func,
    showUserAvatar: PropTypes.bool,
    renderBubble: PropTypes.func,
    renderDay: PropTypes.func,
    renderSystemMessage: PropTypes.func,
    position: PropTypes.oneOf(['left', 'right']),
    currentMessage: PropTypes.object,
    nextMessage: PropTypes.object,
    previousMessage: PropTypes.object,
    user: PropTypes.object,
    inverted: PropTypes.bool,
    containerStyle: PropTypes.shape({
      left: StylePropType,
      right: StylePropType,
    }),
    shouldUpdateMessage: PropTypes.func,
    onMessageLayout: PropTypes.func,
  };

  shouldComponentUpdate(nextProps: MessageProps<TMessage>) {
    const next = nextProps.currentMessage!;
    const current = this.props.currentMessage!;
    const { previousMessage, nextMessage } = this.props;
    const nextPropsMessage = nextProps.nextMessage;
    const nextPropsPreviousMessage = nextProps.previousMessage;

    const shouldUpdate =
      (this.props.shouldUpdateMessage &&
        this.props.shouldUpdateMessage(this.props, nextProps)) ||
      false;

    return (
      next.sent !== current.sent ||
      next.received !== current.received ||
      next.pending !== current.pending ||
      next.createdAt !== current.createdAt ||
      next.text !== current.text ||
      next.image !== current.image ||
      next.video !== current.video ||
      next.audio !== current.audio ||
      previousMessage !== nextPropsPreviousMessage ||
      nextMessage !== nextPropsMessage ||
      shouldUpdate
    );
  }

  renderDay() {
    if (this.props.currentMessage && this.props.currentMessage.createdAt) {
      const { containerStyle, ...props } = this.props;
      if (this.props.renderDay) {
        return this.props.renderDay(props);
      }
      return <Day {...props} />;
    }
    return null;
  }

  renderBubble() {
    const { containerStyle, ...props } = this.props;
    if (this.props.renderBubble) {
      return this.props.renderBubble(props);
    }
    // @ts-ignore
    return <Bubble {...props} />;
  }

  renderSystemMessage() {
    const { containerStyle, ...props } = this.props;

    if (this.props.renderSystemMessage) {
      return this.props.renderSystemMessage(props);
    }
    return <SystemMessage {...props} />;
  }

  renderAvatar() {
    const { user, currentMessage, showUserAvatar } = this.props;

    if (
      user &&
      user._id &&
      currentMessage &&
      currentMessage.user &&
      user._id === currentMessage.user._id &&
      !showUserAvatar
    ) {
      return null;
    }

    if (
      currentMessage &&
      currentMessage.user &&
      currentMessage.user.avatar === null
    ) {
      return null;
    }

    const { containerStyle, ...props } = this.props;
    return <Avatar {...props} />;
  }

  isNextMyMessage =
    this.props.currentMessage &&
    this.props.nextMessage &&
    isSameUser(this.props.currentMessage, this.props.nextMessage) &&
    isSameDay(this.props.currentMessage, this.props.nextMessage);

  renderRightAction = (
    progressAnimatedValue: Animated.AnimatedInterpolation<number>,
  ) => {
    const size = progressAnimatedValue.interpolate({
      inputRange: [0, 1, 100],
      outputRange: [0, 1, 1],
    });
    const trans = progressAnimatedValue.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, -12, -20],
    });
    const { renderLeftIcon } = this.props;

    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: size }, { translateX: trans }],
          },
          this.isNextMyMessage
            ? styles.defaultBottomOffset
            : styles.bottomOffsetNext,
          this.props.position === 'right' && styles.leftOffsetValue,
        ]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {renderLeftIcon}
        </View>
      </Animated.View>
    );
  };
  renderLeftAction = (
    progressAnimatedValue: Animated.AnimatedInterpolation<number>,
  ): React.ReactNode => {
    const size = progressAnimatedValue.interpolate({
      inputRange: [0, 1, 100],
      outputRange: [0, 1, 1],
    });
    const trans = progressAnimatedValue.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, -12, -20],
    });

    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: size }, { translateX: trans }],
          },
          this.isNextMyMessage
            ? styles.defaultBottomOffset
            : styles.bottomOffsetNext,
          this.props.position === 'right' && styles.leftOffsetValue,
        ]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {this.props.renderRightIcon}
        </View>
      </Animated.View>
    );
  };

  onSwipeOpenAction = (direction: 'left' | 'right', swipeable: Swipeable) => {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.impactMedium, {
      enableVibrateFallback: true,
    });
    if (this.props.currentMessage && direction === 'left') {
      this.props.onRightSwipeOpen?.({ ...this.props.currentMessage });
      swipeable.close();
    } else {
      this.props.currentMessage &&
        this.props.onLeftSwipeOpen?.({ ...this.props.currentMessage });
      swipeable.close();
    }
  };

  render() {
    const {
      currentMessage,
      onMessageLayout,
      nextMessage,
      position,
      containerStyle,
      swipeableProps,
    } = this.props;
    if (currentMessage) {
      const sameUser = isSameUser(currentMessage, nextMessage!);
      return (
        <View onLayout={onMessageLayout}>
          {this.renderDay()}
          {currentMessage.system ? (
            this.renderSystemMessage()
          ) : (
            <View
              style={[
                styles[position].container,
                { marginBottom: sameUser ? 2 : 10 },
                !this.props.inverted && { marginBottom: 2 },
                containerStyle && containerStyle[position],
              ]}
            >
              {this.props.position === 'left' ? this.renderAvatar() : null}
              <Swipeable
                renderRightActions={this.renderRightAction}
                renderLeftActions={this.renderLeftAction}
                onSwipeableOpen={this.onSwipeOpenAction}
                {...swipeableProps}
              >
                {this.renderBubble()}
              </Swipeable>
              {this.props.position === 'right' ? this.renderAvatar() : null}
            </View>
          )}
        </View>
      );
    }
    return null;
  }
}
