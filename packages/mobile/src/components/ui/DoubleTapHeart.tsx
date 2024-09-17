import { ReactNode } from 'react';
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

type DoubleTapHeartProps = {
  onDoubleTap?: () => void;
  children: ReactNode;
  doubleTapRef?: React.MutableRefObject<GestureType | undefined>;
};

export const DoubleTapHeart = ({ children, onDoubleTap, doubleTapRef }: DoubleTapHeartProps) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const onTapEnd = () => {
    setTimeout(() => {
      opacity.value = withTiming(0);
      scale.value = withSpring(1);
    }, 850);
  };

  const onTapStart = () => {
    trigger(HapticFeedbackTypes.impactMedium, {
      enableVibrateFallback: true,
    });
  };

  const tapGesture = Gesture.Tap()
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
    tapGesture.withRef(doubleTapRef);
  }

  const animatedStyles = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <GestureDetector gesture={tapGesture}>
      <View>
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
};
