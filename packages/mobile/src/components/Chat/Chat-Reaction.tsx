import { StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { Portal } from 'react-native-portalize';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useChatReaction } from '../../hooks/chat/useChatReaction';
import { useConversation } from '../../hooks/chat/useConversation';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ErrorNotification } from '../ui/Alert/ErrorNotification';
import { SelectedMessageState } from '../../pages/chat/chat-page';

const ChatReaction = memo(
  ({
    selectedMessage,
    openEmojiPicker,
    afterSendReaction,
  }: {
    selectedMessage: SelectedMessageState;
    afterSendReaction: () => void;
    openEmojiPicker: () => void;
  }) => {
    const {
      messageCordinates,
      selectedMessage: message,
      showChatReactionPopup: showReaction,
    } = selectedMessage;
    const scale = useSharedValue(0);
    const { height } = useWindowDimensions();

    useEffect(() => {
      if (message && showReaction) {
        scale.value = withSpring(1);
      } else if (!showReaction) {
        scale.value = 0;
      }
    }, [message, messageCordinates, scale, selectedMessage, showReaction]);

    const reactionStyle = useAnimatedStyle(() => {
      let y = Math.abs(messageCordinates.y);
      let shouldAnimate = false;
      const isLessDistanceFromTop = y < 100;
      console.log('isLessDistanceFromTop', isLessDistanceFromTop, y);
      const isLessDistanceFromBottom = height - y < 0;
      if (isLessDistanceFromBottom) {
        shouldAnimate = true;
      }

      if (isLessDistanceFromTop) {
        shouldAnimate = true;
      }
      y = isNaN(y) ? 0 : y < 80 ? 80 + y : y;
      return {
        transform: [
          {
            translateY: shouldAnimate ? withTiming(y - 70, { duration: 200 }) : y - 70,
          },
        ],
        opacity: showReaction ? withTiming(1, { duration: 200 }) : 0,
      };
    });

    const textStyle = useAnimatedStyle(() => {
      return {
        fontSize: 28,
        color: isDarkMode ? Colors.white : Colors.slate[700],
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

    const { add, get, remove } = useChatReaction({
      conversationId: message?.fileMetadata.appData.groupId,
      messageId: message?.fileMetadata.appData.uniqueId,
    });

    const { data: reactions } = get;

    const filteredReactions = useMemo(
      () => reactions?.filter((reaction) => reaction.fileMetadata.senderOdinId === '') || [],
      [reactions]
    );

    const { mutate: addReaction, error: reactionError } = add;
    const { mutate: removeReaction, error: removeReactionError } = remove;

    const conversation = useConversation({
      conversationId: message?.fileMetadata.appData.groupId,
    }).single.data;

    const sendReaction = useCallback(
      (reaction: string, index: number) => {
        if (!selectedMessage) {
          return;
        } else if (index === 6) {
          openEmojiPicker();
          return;
        } else {
          if (!conversation) return;
          const reactionStrings = filteredReactions.map(
            (reac) => reac.fileMetadata.appData.content.message
          );
          const matchedReaction = reactionStrings.indexOf(reaction);
          if (matchedReaction !== -1) {
            removeReaction({
              conversation,
              reaction: filteredReactions[matchedReaction],
              message: message as HomebaseFile<ChatMessage>,
            });
          }
          addReaction({
            conversation: conversation,
            message: message as HomebaseFile<ChatMessage>,
            reaction,
          });
        }
        afterSendReaction();
      },
      [
        addReaction,
        afterSendReaction,
        conversation,
        filteredReactions,
        message,
        openEmojiPicker,
        removeReaction,
        selectedMessage,
      ]
    );

    const { isDarkMode } = useDarkMode();

    const initialReactions: string[] = ['❤️', '👍', '😀', '😂', '😍', '😡', '➕'];
    return (
      <Portal>
        <ErrorNotification error={reactionError || removeReactionError} />
        <Animated.View
          pointerEvents={showReaction ? 'auto' : 'none'}
          style={[
            styles.reaction,
            reactionStyle,
            {
              backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
            },
          ]}
        >
          {initialReactions.map((reaction, index) => (
            <TouchableOpacity key={index} onPress={() => sendReaction(reaction, index)}>
              <Animated.Text style={textStyle}>{reaction}</Animated.Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Portal>
    );
  }
);

export default ChatReaction;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.red[50],
  },
  messageStyle: {
    position: 'absolute',
  },
  reaction: {
    position: 'absolute',
    padding: 16,
    borderRadius: 50,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
});
