import { useEffect } from 'react';
import notifee from '@notifee/react-native';

export const useDismissNotification = () => {
    useEffect(() => {
        (async () => {
            await notifee.cancelAllNotifications();
        })();
    }, []);

};
