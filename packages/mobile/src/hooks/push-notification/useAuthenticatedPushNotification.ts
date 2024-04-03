import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import messaging from '@react-native-firebase/messaging';
import { useDotYouClientContext } from 'feed-app-common';
import { usePushNotificationPermission } from '../../provider/push-notification/PushNotificationContext';

//

export const useAuthenticatedPushNotification = () => {
  const dotYouClient = useDotYouClientContext();

  const [deviceToken, setDeviceToken] = useState('');
  const { notificationPermissionGranted } = usePushNotificationPermission();

  //////////////////////////////////////////////////////////////////////////////////////////

  //
  // Device token
  //

  // Get the device token
  useEffect(() => {
    if (notificationPermissionGranted) {
      messaging()
        .getToken()
        .then((token) => {
          console.debug('FCM Token:', token);
          setDeviceToken(token);
        })
        .catch((error) => {
          console.error('Error fetching FCM Token:', error);
        });
    }
  }, [notificationPermissionGranted]);

  //

  const updateDeviceToken = useCallback(async () => {
    const client = dotYouClient.createAxiosClient({
      headers: {
        'X-ODIN-FILE-SYSTEM-TYPE': 'Standard',
      },
    });

    await client.post('/notify/push/subscribe-firebase', {
      DeviceToken: deviceToken,
      DevicePlatform: Platform.OS,
      FriendlyName: `${
        Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS
      } | ${Platform.Version}`,
    });
    await AsyncStorage.setItem('deviceToken', deviceToken);
  }, [dotYouClient, deviceToken]);

  //

  const { mutate } = useMutation({
    mutationKey: ['deviceToken', deviceToken],
    mutationFn: updateDeviceToken,
    onError: (error) => {
      console.error('Error updating device token', { error });
    },
  });

  //

  // Send device token to host
  useEffect(() => {
    const uploadDeviceToken = async (): Promise<void> => {
      if (deviceToken) {
        const storedDeviceToken = (await AsyncStorage.getItem('deviceToken')) || null;
        if (storedDeviceToken !== deviceToken) {
          console.log('updating device token', deviceToken);
          mutate();
        }
      }
    };
    uploadDeviceToken();
  }, [deviceToken, mutate]);

  //////////////////////////////////////////////////////////////////////////////////////////
};
