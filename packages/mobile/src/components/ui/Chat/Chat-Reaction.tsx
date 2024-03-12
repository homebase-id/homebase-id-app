import { StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useCallback, useEffect } from 'react';
import { Portal } from 'react-native-portalize';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChatMessageIMessage } from '../../../pages/chat-page';
import { useChatReaction } from '../../../hooks/chat/useChatReaction';
import Toast from 'react-native-toast-message';
import { useConversation } from '../../../hooks/chat/useConversation';
import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { ChatMessage } from '../../../provider/chat/ChatProvider';

const PortalView = ({
  selectedMessage,
  messageCordinates,
  setSelectedMessage,
}: {
  selectedMessage: (ChatMessageIMessage & number) | undefined;
  setSelectedMessage: (message: ChatMessageIMessage | undefined) => void;
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

  const {
    mutate: addReaction,
    error: reactionError,
    status,
  } = useChatReaction({
    conversationId: selectedMessage?.fileMetadata.appData.groupId,
    messageId: selectedMessage?.fileMetadata.appData.uniqueId,
  }).add;

  const conversation = useConversation({
    conversationId: selectedMessage?.fileMetadata.appData.groupId,
  }).single.data;

  const sendReaction = useCallback(
    (reaction: string, index: number) => {
      console.log('selectedMessage', selectedMessage);
      if (!selectedMessage && !conversation) {
        return;
      } else if (index === 6) {
        //TODO: Show Emoji Picker
        return;
      } else {
        addReaction({
          conversation: conversation,
          message: selectedMessage as DriveSearchResult<ChatMessage>,
          reaction,
        });
      }
      setSelectedMessage(undefined);
    },
    [addReaction, conversation, selectedMessage, setSelectedMessage]
  );

  if (!selectedMessage) {
    return null;
  }
  if (reactionError) {
    console.error('Failed to add reaction', reactionError);
    Toast.show({
      type: 'error',
      text1: 'Failed to add reaction',
      text2: reactionError.message,
      position: 'bottom',
    });
  }
  console.log('status', status);

  const initialReactions: string[] = ['❤️', '👍', '😀', '😂', '😍', '😡', '➕'];

  return (
    <Portal>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setSelectedMessage(undefined)}
        style={styles.container}
      >
        <Animated.View style={[styles.reaction, reactionStyle]}>
          {initialReactions.map((reaction, index) => (
            <TouchableOpacity key={index} onPress={() => sendReaction(reaction, index)}>
              <Animated.Text style={textStyle}>{reaction}</Animated.Text>
            </TouchableOpacity>
          ))}

          {/* TODO: Show Emoji Picker */}
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
