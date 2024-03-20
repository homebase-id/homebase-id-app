import { ReactNode, createContext, useEffect, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { debounce } from 'lodash';

export interface NotificationContextType {
  deviceToken: string;
}

export const NotificationContext = createContext<NotificationContextType>({ deviceToken: '' });

interface Props {
  children: ReactNode;
}

export const NotificationProvider: React.FC<Props> = ({ children }) => {
  const [deviceToken, setDeviceToken] = useState('');
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // iOS: OK
  // Android: OK
  //
  // Request permission to use notifications
  useEffect(() => {
    const requestUserPermission = async () => {
      try {
        const status = await notifee.requestPermission();

        if (status) {
          console.log('Notification permission granted.');
          setNotificationPermissionGranted(true);
        } else {
          console.log('Notification permission denied.');
          setNotificationPermissionGranted(false);
        }
      } catch (error) {
        console.error(error);
      }
    };

    requestUserPermission();
  }, []);

  //

  // iOS: OK (assuming notification permission granted)
  // Android: OK
  //
  // Get the device token
  //
  // SEB:TODO send the device token to the backend
  useEffect(() => {
    if (notificationPermissionGranted) {
      messaging()
        .getToken()
        .then((token) => {
          console.log('FCM Token:', token);
          setDeviceToken(token);
        })
        .catch((error) => {
          console.error('Error fetching FCM Token:', error);
        });
    }
  }, [notificationPermissionGranted]);

  //

  // Foreground state messages
  //
  // iOS: ??
  // Android: OK
  //
  // This is called when the app is in the foreground and a message is received
  //
  useEffect(() => {
    if (notificationPermissionGranted) {
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        Alert.alert('A new message arrived!', JSON.stringify(remoteMessage));
      });

      return unsubscribe;
    }
  }, [notificationPermissionGranted]);

  //

  // iOS: ??
  // Android: OK
  //
  // This is called when the app is in the background and a notification is tapped to open the app.
  //
  useEffect(() => {
    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      Alert.alert('Notification tapped!', JSON.stringify(remoteMessage));
    });

    return unsubscribe;
  }, [notificationPermissionGranted]);

  //

  // iOS: ??
  // Android: OK
  //
  // This is called when app is "swiped away" and a notification is tapped to open the app.
  //
  useEffect(() => {
    const checkInitialNotification = async () => {
      const initialNotification = await messaging().getInitialNotification();

      if (initialNotification) {
        Alert.alert('initialNotification', JSON.stringify(initialNotification));
      }
    };

    checkInitialNotification();
  }, [notificationPermissionGranted]);

  //

  // iOS: ??
  // Android: OK
  //
  // This is called when:
  // - the app is opened from a completely closed
  // - the app changes state from inactive to active
  //
  useEffect(() => {
    const getMessageFromStorage = async (): Promise<any | null> => {
      const notificationStr = await AsyncStorage.getItem('lastNotification');
      await AsyncStorage.removeItem('lastNotification');
      return notificationStr ? JSON.parse(notificationStr) : null;
    };

    // SEB:TODO checkForNotifications can potentially be called twice for the same notification. Fix this when we figure how we should
    // store multiple notifications instead of just once.
    // For now we just debounce the function to avoid multiple calls.
    const checkForNotifications = debounce(
      async (): Promise<void> => {
        const storedNotification = await getMessageFromStorage();
        if (storedNotification) {
          Alert.alert('Missed notification', JSON.stringify(storedNotification));
        }
      },
      1000,
      { leading: true, trailing: false }
    );

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        checkForNotifications();
      }
      setAppState(nextAppState);
    });

    // Perform the check on initial component mount or permissionGranted change
    if (notificationPermissionGranted) {
      checkForNotifications();
    }

    // Cleanup subscription
    return () => {
      subscription.remove();
    };
  }, [notificationPermissionGranted, appState]);

  //

  return (
    <NotificationContext.Provider value={{ deviceToken }}>{children}</NotificationContext.Provider>
  );
};
