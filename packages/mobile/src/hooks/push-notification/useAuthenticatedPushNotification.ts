import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { useDotYouClientContext } from 'feed-app-common';
import { handleNotificationEvent } from '../../provider/push-notification/PushNotificationLib';
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

    await client.post('/notify/push/subscribe-firebase', { DeviceToken: deviceToken });
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

  //
  // Notifications
  //

  // Notifee foreground Events
  // https://notifee.app/react-native/docs/events#foreground-events
  useEffect(() => {
    return notifee.onForegroundEvent(async ({ type, detail }) => {
      console.debug('Foreground event:', type, detail);
      await handleNotificationEvent(type, detail, true);
    });
  }, []);

  // SEB:TODO not sure we want to handle missed notifications at all?
  //
  // Initial mount and App state change
  // useEffect(() => {
  //   const handleMissedNotifications = async (): Promise<void> => {
  //     if (notificationPermissionGranted) {
  //       const notifications = getNotifcations();
  //       while (notifications.length > 0) {
  //         await handleNotification(notifications[0]);
  //       }
  //     }
  //   };

  //   const subscription = AppState.addEventListener(
  //     'change',
  //     async (nextAppState: AppStateStatus) => {
  //       if (nextAppState === 'active') {
  //         await handleMissedNotifications();
  //       }
  //     }
  //   );

  //   handleMissedNotifications();

  //   // Cleanup subscription
  //   return () => {
  //     subscription.remove();
  //   };
  // }, [notificationPermissionGranted]);
};
