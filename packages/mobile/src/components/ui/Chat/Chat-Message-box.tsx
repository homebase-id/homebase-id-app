import {
  View,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Message, MessageProps } from 'react-native-gifted-chat';
import { isSameDay, isSameUser } from 'react-native-gifted-chat/lib/utils';
import { Reply } from '../Icons/icons';
import { ChatMessageIMessage } from '../../../pages/chat-page';

type ChatMessageBoxProps = {
  setReplyOnSwipeOpen: (message: ChatMessageIMessage) => void;
  updateRowRef: (ref: any) => void;
  onMessageLayout: (e: LayoutChangeEvent) => void;
  onLongPress: (e: GestureResponderEvent, message: ChatMessageIMessage) => void;
} & MessageProps<ChatMessageIMessage>;

const ChatMessageBox = ({
  setReplyOnSwipeOpen,
  updateRowRef,
  onMessageLayout,
  onLongPress,
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

  const onSwipeOpenAction = () => {
    if (props.currentMessage) {
      setReplyOnSwipeOpen({ ...props.currentMessage });
    }
  };

  return (
    <Pressable
      onLongPress={(e) => {
        return onLongPress(e, props.currentMessage as ChatMessageIMessage);
      }}
    >
      <Swipeable
        ref={updateRowRef}
        friction={2}
        rightThreshold={40}
        renderRightActions={renderRightAction}
        onSwipeableOpen={onSwipeOpenAction}
      >
        <Message {...props} onMessageLayout={onMessageLayout} />
      </Swipeable>
    </Pressable>
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
