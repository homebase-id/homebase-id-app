import { Colors } from '../../../app/Colors';
import { SafeAreaView, ViewProps, ViewStyle } from 'react-native';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';

interface SaferAreaViewProps extends Omit<ViewProps, 'style'> {
  style?: ViewStyle;
}

const OurSafeAreaView = (props: SaferAreaViewProps) => {
  const { style, children, ...rest } = props;
  const { isDarkMode } = useDarkMode();

  return (
    <ErrorBoundary>
      <SafeAreaView
        style={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          minHeight: '100%',
          ...style,
        }}
        {...rest}
      >
        {children}
      </SafeAreaView>
    </ErrorBoundary>
  );
};

export { OurSafeAreaView as SafeAreaView };
