import { ReactNode, useState, FunctionComponent, useEffect } from 'react';
import notifee, { EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import { handleNotificationEvent } from '../../provider/push-notification/PushNotificationLib';
import { PushNotificationPermissionContext } from '../../provider/push-notification/PushNotificationContext';

interface PushNotificationProviderProps {
  children: ReactNode;
}

export const PushNotificationProvider: FunctionComponent<PushNotificationProviderProps> = ({
  children,
}) => {
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState<boolean>(false);

  // Context value that will be provided to any descendants of this provider.
  const value = {
    notificationPermissionGranted,
    setNotificationPermissionGranted,
  };

  useEffect(() => {
    // Request permission - required for iOS
    const requestUserPermission = async () => {
      try {
        const status = await notifee.requestPermission();
        if (status) {
          setNotificationPermissionGranted(true);
          console.debug('Notification permission granted.');
        } else {
          setNotificationPermissionGranted(false);
          console.debug('Notification permission denied.');
        }
      } catch (error) {
        console.error(error);
      }
    };

    // Create channel - required for Android
    const channelId = 'default';
    const createChannel = async () => {
      if (await notifee.isChannelCreated(channelId)) {
        console.debug('Channel exists:', channelId);
      } else {
        const result = await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
        });
        if (result === channelId) {
          console.debug('Channel created:', channelId);
        } else {
          console.error('Failed to create channel:', result);
        }
      }
    };

    // https://notifee.app/react-native/docs/events#app-open-events
    const getInitialNotification = async () => {
      if (Platform.OS === 'android') {
        const initialNotification = await notifee.getInitialNotification();
        if (initialNotification?.notification) {
          console.debug('getInitialNotification:', initialNotification.notification.id);
          await handleNotificationEvent(EventType.PRESS, initialNotification, true);
        }
      }
    };

    requestUserPermission();
    createChannel();
    getInitialNotification();
  }, []);

  return (
    <PushNotificationPermissionContext.Provider value={value}>
      {children}
    </PushNotificationPermissionContext.Provider>
  );
};

//
