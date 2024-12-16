import { memo, ReactNode, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector, GestureType } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SolidHeart } from './Icons/icons';
import { HapticFeedbackTypes, trigger } from 'react-native-haptic-feedback';
import { Colors } from '../../app/Colors';
import { PostContent, ReactionContext } from '@homebase-id/js-lib/public';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import { useMyEmojiReactions, useReaction } from '../../hooks/reactions';
import { ErrorNotification } from './Alert/ErrorNotification';
import { useDotYouClientContext } from 'homebase-id-app-common';

type DoubleTapHeartProps = {
  children: ReactNode;
  odinId?: string;
  postFile: HomebaseFile<PostContent>;
  doubleTapRef?: React.MutableRefObject<GestureType | undefined>;
};

export const DoubleTapHeart = memo(
  ({ children, doubleTapRef, postFile, odinId }: DoubleTapHeartProps) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1);
    const { mutateAsync: postEmoji, error: postEmojiError } = useReaction().saveEmoji;
    const identity = useDotYouClientContext().getLoggedInIdentity();
    const postContent = postFile.fileMetadata.appData.content;
    const reactionContext: ReactionContext = useMemo(() => {
      return {
        odinId: odinId || identity,
        channelId: postContent.channelId,
        target: {
          globalTransitId: postFile.fileMetadata.globalTransitId ?? 'unknown',
          fileId: postFile.fileId ?? 'unknown',
          isEncrypted: postFile.fileMetadata.isEncrypted || false,
        },
      };
    }, [odinId, postContent, postFile, identity]);
    const { data: myEmojis } = useMyEmojiReactions(reactionContext).fetch;

    const doLike = useCallback(() => {
      postEmoji({
        emojiData: {
          body: '❤️',
          authorOdinId: identity || '',
        },
        context: reactionContext,
      });
    }, [identity, postEmoji, reactionContext]);

    const onDoubleTap = useCallback(() => {
      if (myEmojis?.length && myEmojis.find((emoji) => emoji === '❤️')) {
        return;
      }
      doLike();
    }, [doLike, myEmojis]);

    const onTapEnd = useCallback(() => {
      setTimeout(() => {
        opacity.value = withTiming(0);
        scale.value = withSpring(1);
      }, 850);
    }, [opacity, scale]);

    const onTapStart = () => {
      trigger(HapticFeedbackTypes.impactMedium, {
        enableVibrateFallback: true,
      });
    };

    const tapGesture = useMemo(() => {
      const tap = Gesture.Tap()
        .numberOfTaps(2)
        .enabled(!!onDoubleTap)
        .onStart(() => {
          runOnJS(onTapStart)();
          opacity.value = withTiming(1);
          scale.value = withSpring(2, {
            velocity: 10,
            mass: 1.5,
            damping: 9,
          });
          if (onDoubleTap) {
            runOnJS(onDoubleTap)();
          }
        })
        .onEnd(() => {
          runOnJS(onTapEnd)();
        });
      if (doubleTapRef) {
        tap.withRef(doubleTapRef);
      }
      return tap;
    }, [onDoubleTap, onTapEnd, opacity, scale, doubleTapRef]);

    const animatedStyles = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
      };
    });

    return (
      <GestureDetector gesture={tapGesture}>
        <View>
          <ErrorNotification error={postEmojiError} />
          <Animated.View
            pointerEvents={'none'}
            style={[
              {
                display: 'flex',
                justifyContent: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 5,
              },
              animatedStyles,
            ]}
          >
            <SolidHeart size={'6xl'} color={Colors.white} />
          </Animated.View>
          {children}
        </View>
      </GestureDetector>
    );
  }
);
