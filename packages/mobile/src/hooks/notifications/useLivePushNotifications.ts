import { useQueryClient } from '@tanstack/react-query';
import { TypedConnectionNotification, AppNotification } from '@homebase-id/js-lib/core';
import { useCallback } from 'react';
import { useNotificationSubscriber } from '../useNotificationSubscriber';
import { incrementAppIdNotificationCount, insertNewNotification } from './usePushNotifications';
import { useNotification } from './useNotification';

export const useLivePushNotifications = () => {
  const queryClient = useQueryClient();
  const { add } = useNotification();

  const handler = useCallback(
    (wsNotification: TypedConnectionNotification) => {
      if (wsNotification.notificationType === 'appNotificationAdded') {
        const clientNotification = wsNotification as AppNotification;

        insertNewNotification(queryClient, clientNotification);
        incrementAppIdNotificationCount(queryClient, clientNotification.options.appId);
        add(clientNotification);
      }
    },
    [add, queryClient]
  );

  useNotificationSubscriber(handler, ['appNotificationAdded'], []);
};
