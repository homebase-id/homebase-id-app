import { useCallback, useContext, useEffect } from 'react';
import {
  NotificationContext,
  NotificationContextType,
} from '../../components/notification/NotificationProvider';
import { useMutation } from '@tanstack/react-query';
import { useDotYouClientContext } from 'feed-app-common';

export const useNotificationContext = (): NotificationContextType =>
  useContext(NotificationContext);

export const useNotification = () => {
  const dotYouClient = useDotYouClientContext();
  const { deviceToken } = useNotificationContext();

  const updateDeviceToken = useCallback(async () => {
    const client = dotYouClient.createAxiosClient({
      headers: {
        'X-ODIN-FILE-SYSTEM-TYPE': 'Standard',
      },
    });

    await client.post('/notify/push/subscribe-firebase', { DeviceToken: deviceToken });
  }, [dotYouClient, deviceToken]); // Assure these dependencies are stable

  // SEB:TODO test how well useMutation deals with network errors
  const { mutate } = useMutation({
    mutationKey: ['deviceToken', deviceToken],
    mutationFn: updateDeviceToken,
    onError: (error) => {
      console.error('Error updating device token', { error });
    },
  });

  useEffect(() => {
    if (deviceToken) {
      console.log('updating device token', deviceToken);
      mutate();
    }
  }, [deviceToken, mutate]);
};
