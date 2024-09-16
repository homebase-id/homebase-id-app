import { TouchableHighlight, TouchableOpacity } from 'react-native-gesture-handler';
import { Text } from './Text';
import { ActivityIndicator, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { AnimatedProps, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { useState } from 'react';
import { Colors } from '../../../app/Colors';

const AnimatedTouchableHighlight = Animated.createAnimatedComponent(TouchableHighlight);

type TextButtonProps = {
  title: string;
  lightColor?: string;
  darkColor?: string;
  onPress: () => Promise<any> | void;
  filled?: boolean;
  underlayColor?: string;
  showLoaderOnPress?: boolean;
  disabled?: boolean;
  unFilledStyle?: StyleProp<ViewStyle>;
  filledStyle?: StyleProp<ViewStyle>;
  animatedProps?: AnimatedProps<ViewStyle>;
  textStyle?: TextStyle;
};

function TextButton({
  title,
  onPress,
  lightColor,
  darkColor,
  underlayColor,
  filled,
  disabled,
  unFilledStyle,
  filledStyle,
  animatedProps,
  textStyle,
  showLoaderOnPress,
}: TextButtonProps) {
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (showLoaderOnPress) {
      setLoading(true);
      await onPress();
      setLoading(false);
    } else {
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderRadius: withTiming(loading ? 98 : 8),
      width: withTiming(loading ? '45%' : '100%'),
    };
  });

  if (filled) {
    return (
      <AnimatedTouchableHighlight
        disabled={disabled || loading}
        style={[
          {
            backgroundColor: isDarkMode ? darkColor : lightColor,
            // padding: 12,
            alignContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
          },
          filledStyle,
          animatedStyle,
        ]}
        onPress={handlePress}
        underlayColor={underlayColor}
      >
        {loading ? (
          <ActivityIndicator
            size={'small'}
            color={isDarkMode ? lightColor : darkColor}
            style={{
              marginVertical: 2,
              padding: 12,
            }}
          />
        ) : (
          <View style={{ padding: 12 }}>
            <Text style={textStyle}>{title}</Text>
          </View>
        )}
      </AnimatedTouchableHighlight>
    );
  }

  return (
    <Animated.View {...animatedProps}>
      <TouchableOpacity
        style={[
          {
            alignContent: 'center',
            alignItems: 'center',
            borderRadius: 8,
          },
          unFilledStyle,
        ]}
        onPress={onPress}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: Colors.purple[500],
            ...textStyle,
          }}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default TextButton;
