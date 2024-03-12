import { StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useEffect } from 'react';
import { Portal } from 'react-native-portalize';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChatMessageIMessage } from '../../../pages/chat-page';

const PortalView = ({
  selectedMessage,
  messageCordinates,
  setSelectedMessage,
}: {
  selectedMessage: (ChatMessageIMessage & number) | null;
  setSelectedMessage: (message: ChatMessageIMessage | null) => void;
  messageCordinates: { x: number; y: number };
}) => {
  const scale = useSharedValue(0);
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (selectedMessage) {
      scale.value = withSpring(1);
    } else {
      scale.value = 0;
    }
  }, [scale, selectedMessage]);

  //TODO:(@2002Bishwajeet) @stef-coenen - Need help here
  // Double Tap
  // Layout Height
  // Is this Clean?????????
  const reactionStyle = useAnimatedStyle(() => {
    let y = messageCordinates.y || 0;
    let shouldAnimate = false;
    const isLessDisatanceFromTop = y < 100;
    const isLessDisatanceFromBottom = height - y < selectedMessage?.layoutHeight;
    if (isLessDisatanceFromBottom) {
      y = y - selectedMessage?.layoutHeight;
      shouldAnimate = true;
    }

    if (isLessDisatanceFromTop) {
      y = y + selectedMessage?.layoutHeight;
      shouldAnimate = true;
    }
    y = isNaN(y) ? 0 : y;
    return {
      transform: [
        {
          translateY: shouldAnimate ? withTiming(y - 70, { duration: 200 }) : y - 70,
        },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      fontSize: 28,
      transform: [
        {
          scale: scale.value,
        },
        {
          translateY: interpolate(scale.value, [0, 1], [50, 0]),
        },
      ],
    };
  });

  if (!selectedMessage) {
    return null;
  }

  return (
    <Portal>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setSelectedMessage(null)}
        style={styles.container}
      >
        <Animated.View style={[styles.reaction, reactionStyle]}>
          <Animated.Text style={textStyle}>❤️</Animated.Text>
          <Animated.Text style={textStyle}>👍</Animated.Text>
          <Animated.Text style={textStyle}>😀</Animated.Text>
          <Animated.Text style={textStyle}>😂</Animated.Text>
          <Animated.Text style={textStyle}>😍</Animated.Text>
          <Animated.Text style={textStyle}>😡</Animated.Text>
          <Animated.Text style={textStyle}>➕</Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Portal>
  );
};

export default PortalView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageStyle: {
    position: 'absolute',
  },
  reaction: {
    position: 'absolute',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 50,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
});
