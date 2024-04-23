import { useQueryClient } from '@tanstack/react-query';
import {
  TypedConnectionNotification,
  PushNotification,
  AppNotification,
} from '@youfoundation/js-lib/core';
import { useCallback } from 'react';
import { useNotificationSubscriber } from '../useNotificationSubscriber';
import { stringGuidsEqual } from '@youfoundation/js-lib/helpers';

export const useLivePushNotifications = () => {
  const queryClient = useQueryClient();

  const handler = useCallback(
    (wsNotification: TypedConnectionNotification) => {
      if (wsNotification.notificationType === 'appNotificationAdded') {
        const clientNotification = wsNotification as AppNotification;

        const existingNotificationData = queryClient.getQueryData<{
          results: PushNotification[];
          cursor: number;
        }>(['push-notifications']);

        if (!existingNotificationData) return;
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
    },
    [queryClient]
  );

  useNotificationSubscriber(handler, ['appNotificationAdded'], []);
};
