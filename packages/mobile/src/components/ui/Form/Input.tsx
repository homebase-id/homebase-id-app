import { Platform, StyleSheet, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors, LumiColors } from '../../../app/Colors';
import Animated from 'react-native-reanimated';

export type InputProps = TextInputProps & {
  viewStyle?: ViewStyle;
};

export const Input = (props: InputProps) => {
  const { isDarkMode } = useDarkMode();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? `${LumiColors[700]}3A` : `${LumiColors[300]}3C`,
          padding: Platform.OS === 'ios' ? 16 : 4,
        },
        props.viewStyle,
      ]}
    >
      <TextInput
        {...props}
        style={[
          styles.input,
          { color: isDarkMode ? Colors.white : Colors.black },
          props.style,
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    paddingLeft: 12,
    marginVertical: 12,
  },
  input: {
    fontSize: 16,
  },
});
