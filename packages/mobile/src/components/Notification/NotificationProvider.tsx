import { useEffect } from 'react';
import notifee from '@notifee/react-native';

const NotificationProvider = () => {
  useEffect(() => {
    const requestUserPermission = async () => {
      try {
        const status = await notifee.requestPermission();

        if (status) {
          console.log('Notification permission granted.');
        } else {
          console.log('Notification permission denied.');
        }
      } catch (error) {
        console.error(error);
      }
    };

    requestUserPermission();
  }, []);

  // This component doesn't render anything
  return null;
};

export default NotificationProvider;
