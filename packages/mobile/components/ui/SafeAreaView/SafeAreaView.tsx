import { useDarkMode } from 'homebase-feed-app';
import { Colors } from '../../../app/Colors';
import { SafeAreaView, ViewProps, ViewStyle } from 'react-native';

interface SaferAreaViewProps extends Omit<ViewProps, 'style'> {
  style?: ViewStyle;
}

const OurSafeAreaView = (props: SaferAreaViewProps) => {
  const { style, children, ...rest } = props;
  const { isDarkMode } = useDarkMode();

  return (
    <SafeAreaView
      style={{
        backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        minHeight: '100%',
        ...style,
      }}
      {...rest}>
      {children}
    </SafeAreaView>
  );
};

export { OurSafeAreaView as SafeAreaView };
