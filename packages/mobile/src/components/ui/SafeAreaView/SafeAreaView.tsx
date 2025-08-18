import { Colors } from '../../../app/Colors';
import { SafeAreaView, ViewProps, ViewStyle } from 'react-native';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { SystemBars } from 'react-native-edge-to-edge';

interface SaferAreaViewProps extends Omit<ViewProps, 'style'> {
  style?: ViewStyle;
}

const OurSafeAreaView = (props: SaferAreaViewProps) => {
  const { style, children, ...rest } = props;
  const { isDarkMode } = useDarkMode();

  return (
    <ErrorBoundary>
      <SystemBars style={'auto'} />
      {/* <StatusBar
        backgroundColor={isDarkMode ? Colors.gray[900] : Colors.slate[50]}
        animated
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      /> */}
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
