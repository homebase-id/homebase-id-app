import { View, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Message, MessageProps, isSameUser, isSameDay } from 'react-native-gifted-chat';

import { Info, Reply } from '../Icons/icons';
import { ChatMessageIMessage } from '../../../pages/chat/chat-page';
import { useCallback } from 'react';

type ChatMessageBoxProps = {
  setReplyOnSwipeOpen: (message: ChatMessageIMessage) => void;
  onLeftSwipeOpen: (message: ChatMessageIMessage) => void;
  updateRowRef: (ref: any) => void;
  onMessageLayout: (e: LayoutChangeEvent) => void;
} & MessageProps<ChatMessageIMessage>;

const ChatMessageBox = ({
  setReplyOnSwipeOpen,
  updateRowRef,
  onMessageLayout,
  ...props
}: ChatMessageBoxProps) => {
  const isNextMyMessage =
    props.currentMessage &&
    props.nextMessage &&
    isSameUser(props.currentMessage, props.nextMessage) &&
    isSameDay(props.currentMessage, props.nextMessage);

  const renderRightAction = (progressAnimatedValue: Animated.AnimatedInterpolation<number>) => {
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
          { transform: [{ scale: size }, { translateX: trans }] },
          isNextMyMessage ? styles.defaultBottomOffset : styles.bottomOffsetNext,
          props.position === 'right' && styles.leftOffsetValue,
        ]}
      >
        <View style={styles.replyImageWrapper}>
          <Reply />
        </View>
      </Animated.View>
    );
  };
  const renderLeftAction = (progressAnimatedValue: Animated.AnimatedInterpolation<number>) => {
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
          { transform: [{ scale: size }, { translateX: trans }] },
          isNextMyMessage ? styles.defaultBottomOffset : styles.bottomOffsetNext,
          props.position === 'right' && styles.leftOffsetValue,
        ]}
      >
        <View style={styles.replyImageWrapper}>
          <Info />
        </View>
      </Animated.View>
    );
  };

  const onSwipeOpenStartDrag = useCallback(
    (direction: 'left' | 'right') => {
      if (props.currentMessage && direction === 'right') {
        setReplyOnSwipeOpen({ ...props.currentMessage });
      }
    },
    [props.currentMessage, setReplyOnSwipeOpen]
  );

  const onSwipeOpenAction = useCallback(
    (direction: 'left' | 'right', swipeable: Swipeable) => {
      if (props.currentMessage && direction === 'right') {
        swipeable && swipeable.close();
      } else {
        props.currentMessage && props.onLeftSwipeOpen({ ...props.currentMessage });
        swipeable && swipeable.close();
      }
    },
    [props]
  );

  return (
    <Swipeable
      ref={updateRowRef}
      friction={3}
      overshootFriction={8}
      rightThreshold={40}
      leftThreshold={40}
      renderRightActions={renderRightAction}
      renderLeftActions={renderLeftAction}
      onSwipeableOpen={onSwipeOpenAction}
      onSwipeableOpenStartDrag={onSwipeOpenStartDrag}
    >
      <Message {...props} onMessageLayout={onMessageLayout} />
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
  },
  replyImageWrapper: {
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
});

export default ChatMessageBox;
