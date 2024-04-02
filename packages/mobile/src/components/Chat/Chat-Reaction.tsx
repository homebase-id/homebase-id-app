import { StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ErrorNotification } from '../ui/Alert/ErrorNotification';
import { ChatMessageIMessage } from './ChatDetail';

const PortalView = ({
  selectedMessage,
  messageCordinates,
  setSelectedMessage,
  openEmojiPicker,
}: {
  selectedMessage: ChatMessageIMessage | undefined;
  setSelectedMessage: (message: ChatMessageIMessage | undefined) => void;
  messageCordinates: { x: number; y: number };
  openEmojiPicker: () => void;
}) => {
  const scale = useSharedValue(0);
  const { height } = useWindowDimensions();
  const { dismiss } = useBottomSheetModal();
  const [emojiModalOpen, setEmojiModalOpen] = useState<boolean>(false);
  useEffect(() => {
    if (selectedMessage) {
      scale.value = withSpring(1);
    } else {
      scale.value = 0;
    }
  }, [scale, selectedMessage]);

  const reactionStyle = useAnimatedStyle(() => {
    let y = messageCordinates.y;
    let shouldAnimate = false;
    const isLessDistanceFromTop = y < 100;
    const isLessDistanceFromBottom = height - y < 0;
    if (isLessDistanceFromBottom) {
      shouldAnimate = true;
    }

    if (isLessDistanceFromTop) {
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
  }, [messageCordinates, selectedMessage]);

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
  }, [selectedMessage]);

  const { add, get, remove } = useChatReaction({
    conversationId: selectedMessage?.fileMetadata.appData.groupId,
    messageId: selectedMessage?.fileMetadata.appData.uniqueId,
  });

  const { data: reactions } = get;

  const filteredReactions = useMemo(
    () => reactions?.filter((reaction) => reaction.fileMetadata.senderOdinId === '') || [],
    [reactions]
  );

  const { mutate: addReaction, error: reactionError } = add;
  const { mutate: removeReaction, error: removeReactionError } = remove;

  const conversation = useConversation({
    conversationId: selectedMessage?.fileMetadata.appData.groupId,
  }).single.data;

  const sendReaction = useCallback(
    (reaction: string, index: number) => {
      if (!selectedMessage) {
        return;
      } else if (index === 6) {
        openEmojiPicker();
        setEmojiModalOpen(true);
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
            message: selectedMessage,
          });
        }
        addReaction({
          conversation: conversation,
          message: selectedMessage as HomebaseFile<ChatMessage>,
          reaction,
        });
      }
      setSelectedMessage(undefined);
    },
    [
      addReaction,
      conversation,
      filteredReactions,
      openEmojiPicker,
      removeReaction,
      selectedMessage,
      setSelectedMessage,
    ]
  );

  const { isDarkMode } = useDarkMode();

  if (!selectedMessage) {
    return null;
  }

  const initialReactions: string[] = ['❤️', '👍', '😀', '😂', '😍', '😡', '➕'];
  return (
    <Portal>
      <ErrorNotification error={reactionError || removeReactionError} />
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          dismiss();
          setSelectedMessage(undefined);
          setEmojiModalOpen(false);
        }}
        style={styles.container}
      >
        {!emojiModalOpen && (
          <Animated.View
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
        )}
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
    padding: 16,
    borderRadius: 50,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
});
