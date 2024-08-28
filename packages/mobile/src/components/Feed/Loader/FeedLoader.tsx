import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../../../app/Colors';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { memo } from 'react';

export const FeedLoader = memo(() => {
  const { isDarkMode } = useDarkMode();
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={isDarkMode ? Colors.indigo[400] : Colors.indigo[700]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
