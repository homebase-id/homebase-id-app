import { View, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Message, MessageProps, isSameUser, isSameDay } from 'react-native-gifted-chat';
import { ChatMessageIMessage } from './ChatDetail';
import { Info, Reply } from '../ui/Icons/icons';
import { ChatDeletedArchivalStaus } from '../../provider/chat/ChatProvider';
import { memo, useCallback, useMemo } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

type ChatMessageBoxProps = {
  setReplyOnSwipeOpen: (message: ChatMessageIMessage) => void;
  onLeftSwipeOpen: (message: ChatMessageIMessage) => void;
  onMessageLayout?: (e: LayoutChangeEvent) => void;
} & MessageProps<ChatMessageIMessage>;

const ChatMessageBox = memo(({ setReplyOnSwipeOpen, ...props }: ChatMessageBoxProps) => {
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
          <Info />
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
          <Reply />
        </View>
      </Animated.View>
    );
  };

  const onSwipeOpenAction = useCallback(
    (direction: 'left' | 'right', swipeable: Swipeable) => {
      ReactNativeHapticFeedback.trigger('impactLight');
      if (props.currentMessage && direction === 'left') {
        setReplyOnSwipeOpen({ ...props.currentMessage });
        swipeable.close();
      } else {
        props.currentMessage && props.onLeftSwipeOpen({ ...props.currentMessage });
        swipeable.close();
      }
    },
    [props, setReplyOnSwipeOpen]
  );
  const enabled = useMemo(
    () =>
      props.currentMessage &&
      props.currentMessage.fileMetadata.appData.archivalStatus !== ChatDeletedArchivalStaus,
    [props.currentMessage]
  );

  return (
    <Swipeable
      friction={3}
      overshootFriction={8}
      activeOffsetX={[-30, 30]}
      failOffsetY={[-30, 30]}
      rightThreshold={40}
      leftThreshold={20}
      enabled={enabled}
      renderRightActions={renderRightAction}
      renderLeftActions={renderLeftAction}
      onSwipeableOpen={onSwipeOpenAction}
    >
      <Message {...props} />
    </Swipeable>
  );
});

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
