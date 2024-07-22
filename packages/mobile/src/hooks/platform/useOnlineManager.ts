import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import axios from 'axios';

import { useEffect, useState } from 'react';

// Try to make a ping request to the identity. It may happen you have a wifi connection but either the identity is down or the internet is down
export const pingIdentity = (identity: string) => new Promise<boolean>((resolve) => {
  axios.get(`https://${identity}/api/guest/v1/auth/ident`, {
    timeout: 5000,
  })
    .then(() => resolve(true))
    .catch(() => resolve(false));
});

export const useOnlineManager = () => {
  const [isOffline, setIsOffline] = useState(false);

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
