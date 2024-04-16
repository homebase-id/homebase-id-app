import { ReactNode, useState, FunctionComponent, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { PushNotificationPermissionContext } from '../../provider/push-notification/PushNotificationContext';
import { PermissionsAndroid, Platform } from 'react-native';
import { getApiLevel } from 'react-native-device-info';

interface PushNotificationProviderProps {
  children: ReactNode;
}

export const PushNotificationProvider: FunctionComponent<PushNotificationProviderProps> = ({
  children,
}) => {
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState<boolean>(false);

  const value = {
    notificationPermissionGranted,
    setNotificationPermissionGranted,
  };

  useEffect(() => {
    const requestUserPermission = async () => {
      let status = false;

      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        status =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      } else if (Platform.OS === 'android') {
        if ((await getApiLevel()) < 33) {
          status = true;
        } else {
          const authStatus = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          status = authStatus === PermissionsAndroid.RESULTS.GRANTED;
        }
      }

      if (status) {
        setNotificationPermissionGranted(true);
        // console.debug('Notification permission granted.');
      } else {
        setNotificationPermissionGranted(false);
        console.debug('Notification permission denied.');
      }
    };

    requestUserPermission();
  }, []);

  return (
    <PushNotificationPermissionContext.Provider value={value}>
      {children}
    </PushNotificationPermissionContext.Provider>
  );
};

//
