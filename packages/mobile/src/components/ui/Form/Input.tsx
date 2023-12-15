import { TextInput, TextInputProps } from 'react-native';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export const Input = (props: TextInputProps) => {
  const { isDarkMode } = useDarkMode();

  return (
    <TextInput
      {...props}
      style={{
        height: 40,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: isDarkMode ? Colors.slate[700] : Colors.slate[300],
        borderRadius: 4,
        padding: 10,
        color: isDarkMode ? Colors.white : Colors.black,
        ...((props.style as Record<string, unknown>) || {}),
      }}
    />
  );
};
