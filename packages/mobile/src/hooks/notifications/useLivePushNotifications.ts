import { useQueryClient } from '@tanstack/react-query';
import {
  TypedConnectionNotification,
  PushNotification,
  AppNotification,
} from '@homebase-id/js-lib/core';
import { useCallback } from 'react';
import { useNotificationSubscriber } from '../useNotificationSubscriber';
import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { incrementAppIdNotificationCount } from './usePushNotifications';
import { useNotification } from './useNotification';

export const useLivePushNotifications = () => {
  const queryClient = useQueryClient();
  const { add } = useNotification();


  const handler = useCallback(
    (wsNotification: TypedConnectionNotification) => {
      if (wsNotification.notificationType === 'appNotificationAdded') {
        const clientNotification = wsNotification as AppNotification;
        const existingNotificationData = queryClient.getQueryData<{
          results: PushNotification[];
          cursor: number;
        }>(['push-notifications']);

        if (existingNotificationData) {
          const newNotificationData = {
            ...existingNotificationData,
            results: [
              clientNotification,
              ...existingNotificationData.results.filter(
                (notification) =>
                  !stringGuidsEqual(notification.options.tagId, clientNotification.options.tagId)
              ),
            ],
          };

          queryClient.setQueryData(['push-notifications'], newNotificationData);
        }
        incrementAppIdNotificationCount(queryClient, clientNotification.options.appId);
        add(clientNotification);
      }
    },
    [add, queryClient]
  );


  useNotificationSubscriber(handler, ['appNotificationAdded'], []);
};
