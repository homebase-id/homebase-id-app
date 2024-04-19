import { useMemo } from 'react';
import { BottomSheetBackdropProps, useBottomSheetModal } from '@gorhom/bottom-sheet';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Pressable } from 'react-native';

const Backdrop = ({ animatedIndex, style }: BottomSheetBackdropProps) => {
  console.log('Backdrop', animatedIndex);
  // animated variables
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const { dismissAll } = useBottomSheetModal();

  // styles
  const containerStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: '#A0A0A0',
      },
      containerAnimatedStyle,
    ],
    [style, containerAnimatedStyle]
  );

  return (
    <Pressable onPress={dismissAll}>
      <Animated.View style={containerStyle} />
    </Pressable>
  );
};

export default Backdrop;
