import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

import { useEffect, useState } from 'react';

export const useOnlineManager = () => {
  const [isOffline, setIsOffline] = useState(true);

  useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener(async (state) => {
        // If there is a connection, we ping the identity to make sure it is up
        setOnline(!!state.isConnected);
        setIsOffline(!state.isConnected);
      });
    });
  }, []);

  useEffect(() => {
    if (onlineManager.isOnline()) return;
    // When we go offline, we check after 5 seconds if we are back online; To avoid spotty connections killing mutations
    const timeout = setTimeout(() => {
      NetInfo.fetch().then(async (state) => {
        onlineManager.setOnline(!!state.isConnected);
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isOffline]);
};
