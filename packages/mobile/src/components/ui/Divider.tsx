import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from './Text/Text';
import { Colors } from '../../app/Colors';

export const Divider = ({
  text,
  width,
  color,
  style,
}: {
  text: string;
  width?: number;
  color?: string;
  style?: ViewStyle;
}) => {
  return (
    <View style={style || styles.default}>
      <View style={{ flex: 1, height: width || 1, backgroundColor: color || Colors.gray[300] }} />
      <Text style={{ marginHorizontal: 10 }}>{text}</Text>
      <View style={{ flex: 1, height: width || 1, backgroundColor: color || Colors.gray[300] }} />
    </View>
  );
};

const styles = StyleSheet.create({
  default: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
});
