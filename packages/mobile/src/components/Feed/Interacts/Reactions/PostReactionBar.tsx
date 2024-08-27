import { Pressable, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { memo, useEffect } from 'react';
import { Portal } from 'react-native-portalize';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../../../app/Colors';
import { ReactionContext } from '@homebase-id/js-lib/public';
import { CanReactInfo, useMyEmojiReactions, useReaction } from '../../../../hooks/reactions';
import { useDotYouClientContext } from 'feed-app-common';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';
import { CantReactInfo } from '../../CanReactInfo';
import EmojiPicker from 'rn-emoji-picker';
import { emojis } from 'rn-emoji-picker/dist/data';

export const PostReactionBar = memo(
  ({
    context,
    canReact,
    coordinates,
    isActive,
    onClose,
  }: {
    context: ReactionContext;
    canReact?: CanReactInfo;
    coordinates?: {
      x: number;
      y: number;
    };
    isActive: boolean;
    onClose: () => void;
  }) => {
    const identity = useDotYouClientContext().getIdentity();
    const {
      saveEmoji: { mutate: postEmoji, error: postEmojiError },
      removeEmoji: { mutate: removeEmoji, error: removeEmojiError },
    } = useReaction();
    const { data: myEmojis } = useMyEmojiReactions(context).fetch;

    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const { height } = useWindowDimensions();

    useEffect(() => {
      if (isActive) {
        scale.value = withSpring(1);
      } else if (!isActive) {
        scale.value = withSpring(0);
      }
    }, [isActive, scale]);

    const reactionStyle = useAnimatedStyle(() => {
      let y = coordinates?.y || 0;
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
            translateY: shouldAnimate ? withTiming(y - 80, { duration: 200 }) : y - 80,
          },
        ],
        opacity: isActive ? withTiming(1, { duration: 200 }) : 0,
      };
    });

    const emojiPickerStyle = useAnimatedStyle(() => {
      let y = coordinates?.y || 0;
      y = isNaN(y) ? 0 : y;
      return {
        opacity: withTiming(opacity.value, { duration: 200 }),
        pointerEvents: opacity.value === 0 ? 'none' : 'auto',
        transform: [
          {
            translateY: y,
          },
        ],
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

    const doLike = async (body: string) => {
      postEmoji({
        emojiData: { body: body, authorOdinId: identity || '' },
        context,
      });

      opacity.value = 0;
      onClose?.();
    };
    const doUnlike = (body: string) => {
      removeEmoji({
        emojiData: { body: body, authorOdinId: identity || '' },
        context,
      });

      opacity.value = 0;
      onClose?.();
    };

    const onSelectEmoji = (emoji: { emoji: string }) => {
      if (myEmojis?.includes(emoji.emoji)) {
        return doUnlike(emoji.emoji);
      }
      doLike(emoji.emoji);
    };

    const _onClose = () => {
      opacity.value = 0;
      onClose?.();
    };

    const { isDarkMode } = useDarkMode();

    const initialReactions = ['❤️', '👍', '😀', '😂', '😍', '😡', '➕'];

    const defaultReactions = myEmojis && myEmojis?.length > 0 ? [...myEmojis, '➕'] : undefined;

    if (!canReact || canReact?.canReact === false || canReact?.canReact === 'comment') {
      return (
        <Animated.View
          style={[
            styles.reaction,
            reactionStyle,
            {
              backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
            },
          ]}
        >
          <CantReactInfo cantReact={canReact} intent="emoji" />
        </Animated.View>
      );
    }

    return (
      <Portal>
        <Pressable
          pointerEvents={isActive ? 'auto' : 'none'}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
          }}
          onPress={_onClose}
        >
          <ErrorNotification error={postEmojiError || removeEmojiError} />
          <Animated.View
            style={[
              styles.reaction,
              reactionStyle,
              {
                backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
              },
            ]}
          >
            {defaultReactions
              ? defaultReactions.map((reaction, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      if (index === defaultReactions.length - 1) {
                        opacity.value = withTiming(1);
                        return;
                      }
                      return doUnlike(reaction);
                    }}
                  >
                    <Animated.Text style={textStyle}>{reaction}</Animated.Text>
                  </TouchableOpacity>
                ))
              : initialReactions.map((reaction, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      if (index === initialReactions.length - 1) {
                        opacity.value = 1;
                        return;
                      }
                      return doLike(reaction);
                    }}
                  >
                    <Animated.Text style={textStyle}>{reaction}</Animated.Text>
                  </TouchableOpacity>
                ))}
          </Animated.View>
          <Animated.View
            style={[
              emojiPickerStyle,
              {
                marginHorizontal: 16,
                height: 300,
              },
            ]}
          >
            <EmojiPicker
              emojis={emojis} // emojis data source see data/emojis
              autoFocus={false} // autofocus search input
              loading={false} // spinner for if your emoji data or recent store is async
              darkMode={isDarkMode} // to be or not to be, that is the question
              perLine={7} // # of emoji's per line
              onSelect={onSelectEmoji}
              backgroundColor={isDarkMode ? Colors.gray[900] : Colors.slate[50]}
            />
          </Animated.View>
        </Pressable>
      </Portal>
    );
  }
);

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
