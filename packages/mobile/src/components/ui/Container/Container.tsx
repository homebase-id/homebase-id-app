import { View, ViewProps, ViewStyle } from 'react-native';

interface ContainerProps extends Omit<ViewProps, 'style'> {
  style?: ViewStyle;
}

const Container = (props: ContainerProps) => {
  const { style, ...rest } = props;

  return <View style={{ ...style, paddingHorizontal: 5 }} {...rest} />;
};

export { Container };
