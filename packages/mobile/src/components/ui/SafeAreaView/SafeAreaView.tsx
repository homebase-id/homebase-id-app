import { Colors } from '../../../app/Colors';
import { SafeAreaView, StatusBar, ViewProps, ViewStyle } from 'react-native';
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
      <StatusBar
        backgroundColor={isDarkMode ? Colors.gray[900] : Colors.slate[50]}
        animated
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
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
