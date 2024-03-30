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

  // Handle foreground or pressed notification
  const handleForegroundNotification = useCallback(
    async (notification: PushNotificationMessage) => {
      console.debug('Handling foreground notification', notification.id);
      deleteNotification(notification);
      await notifee.cancelNotification(notification.id);

      // SEB:TODO do stuff with the notification...
      Alert.alert(
        'Foreground Notification',
        `Message ${notification.id} received from ${notification.data.senderId || 'unknown'}`
      );
    },
    []
  );

  //

  // Handle background notification
  const handleBackgroundNotification = useCallback(
    async (notification: PushNotificationMessage) => {
      console.debug('Handling background notification', notification.id);
      deleteNotification(notification);
      await notifee.cancelNotification(notification.id);

      // SEB:TODO do stuff with the notification...
      Alert.alert(
        'Background Notification',
        `Message ${notification.id} received from ${notification.data.senderId || 'unknown'}`
      );
    },
    []
  );

  //

  // Subscribe to notifications
  useEffect(() => {
    const onPushNotification = async (type: EventType, notification: PushNotificationMessage) => {
      await handleForegroundNotification(notification);
    };
    return Subscribe(onPushNotification);
  }, [handleForegroundNotification]);

  //

  // Process missed/background notifications
  useEffect(() => {
    const handleBackgroundNotifications = async (): Promise<void> => {
      if (notificationPermissionGranted) {
        const notifications = getNotifcations();
        for (const notification of notifications) {
          await handleBackgroundNotification(notification);
        }
        notifee.setBadgeCount(0);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          await handleBackgroundNotifications();
        }
      }
    );

    handleBackgroundNotifications();

    // Cleanup subscription
    return () => {
      subscription.remove();
    };
  }, [handleBackgroundNotification, notificationPermissionGranted]);
};
