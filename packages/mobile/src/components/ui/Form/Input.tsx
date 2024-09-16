import { TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import Animated from 'react-native-reanimated';

export type InputProps = TextInputProps & {
  viewStyle?: ViewStyle;
};

export const Input = (props: InputProps) => {
  const { isDarkMode } = useDarkMode();

  return (
    <Animated.View
      style={[
        {
          backgroundColor: isDarkMode ? `${Colors.indigo[700]}3A` : `${Colors.indigo[300]}3C`,
          borderRadius: 8,
          padding: 16,
          marginVertical: 12,
        },
        props.viewStyle,
      ]}
    >
      <TextInput
        {...props}
        style={{
          // height: 40,
          // borderWidth: 1,
          // borderColor: isDarkMode ? Colors.slate[700] : Colors.slate[300],
          // flex: 1,
          fontSize: 16,
          color: isDarkMode ? Colors.white : Colors.black,
          ...((props.style as Record<string, unknown>) || {}),
        }}
      />
    </Animated.View>
  );
};
