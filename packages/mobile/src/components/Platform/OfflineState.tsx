import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../app/Colors';
import { t } from 'feed-app-common';
import { onlineManager } from '@tanstack/react-query';
import { fetch } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export const OfflineState = () => {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());

  useEffect(() => {
    onlineManager.subscribe((online) => setIsOnline(online));
  }, [setIsOnline]);

  if (isOnline) return null;
  return (
    <TouchableOpacity
      onPress={() => {
        fetch().then((state) => {
          // When in doubt set online
          onlineManager.setOnline(!!state.isConnected);
        });
      }}
    >
      <View style={styles.container}>
        <Text style={styles.text}>{t('No internet connection')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  container: {
    backgroundColor: Colors.red[500],
    padding: 10,
  },
  text: {
    color: 'white',
  },
};
