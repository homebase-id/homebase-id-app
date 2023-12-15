import { ActivityIndicator, SafeAreaView } from 'react-native';

const LoadingPage = () => {
  return (
    <SafeAreaView style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <ActivityIndicator size="large" />
    </SafeAreaView>
  );
};

export default LoadingPage;
