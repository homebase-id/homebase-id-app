import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { useDotYouClientContext } from 'feed-app-common';
import {
  PushNotificationMessage,
  Subscribe,
  deleteNotification,
  getNotifcations,
} from '../../provider/push-notification/PushNotificationLib';
import { usePushNotificationPermission } from '../../provider/push-notification/PushNotificationContext';
import { Alert, AppState, AppStateStatus } from 'react-native';

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

  const handleNotification = useCallback(async (notification: PushNotificationMessage) => {
    deleteNotification(notification);
    await notifee.cancelNotification(notification.id);
    // SEB:TODO do stuff with the notification...
    Alert.alert(notification.id);
  }, []);

  //

  useEffect(() => {
    const onPushNotification = async (type: EventType, notification: PushNotificationMessage) => {
      await handleNotification(notification);
    };
    return Subscribe(onPushNotification);
  }, [handleNotification]);

  //

  // Initial mount and App state change
  useEffect(() => {
    const handleMissedNotifications = async (): Promise<void> => {
      if (notificationPermissionGranted) {
        const notifications = getNotifcations();
        for (const notification of notifications) {
          await handleNotification(notification);
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          await handleMissedNotifications();
        }
      }
    );

    handleMissedNotifications();

    // Cleanup subscription
    return () => {
      subscription.remove();
    };
  }, [handleNotification, notificationPermissionGranted]);
};
