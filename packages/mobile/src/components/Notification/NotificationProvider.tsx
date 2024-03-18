import { useEffect, useState } from 'react';
import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

const NotificationProvider = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);

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
          setPermissionGranted(true);
        } else {
          console.log('Notification permission denied.');
          setPermissionGranted(false);
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
  useEffect(() => {
    if (permissionGranted) {
      messaging()
        .getToken()
        .then((token) => {
          console.log('FCM Token:', token);
        })
        .catch((error) => {
          console.error('Error fetching FCM Token:', error);
        });
    }
  }, [permissionGranted]);

  //

  // This component doesn't render anything
  return null;
};

export default NotificationProvider;
