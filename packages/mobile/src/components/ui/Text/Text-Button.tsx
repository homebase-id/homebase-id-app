import { TouchableOpacity } from 'react-native-gesture-handler';
import { Text } from './Text';
import { TextStyle } from 'react-native';
import { Colors } from '../../../app/Colors';

type TextButtonProps = {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: TextStyle;
};

const TextButton = (props: TextButtonProps) => {
  return (
    <TouchableOpacity onPress={props.onPress} disabled={props.disabled}>
      <Text
        style={{
          fontSize: 16,
          color: props.disabled ? Colors.slate[400] : Colors.purple[500],
          fontWeight: '600',
          ...props.style,
        }}>
        {props.title}
      </Text>
    </TouchableOpacity>
  );
};

export default TextButton;
