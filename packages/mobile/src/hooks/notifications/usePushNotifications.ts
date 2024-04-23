import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DeleteNotifications,
  GetNotifications,
  MarkNotificationsAsRead,
} from '@youfoundation/js-lib/core';
import { useEffect } from 'react';
import { hasDebugFlag, stringGuidsEqual } from '@youfoundation/js-lib/helpers';
import { useDotYouClientContext } from 'feed-app-common';

const isDebug = hasDebugFlag();
const PAGE_SIZE = 50;
export const usePushNotifications = (props?: { appId?: string }) => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const getNotifications = async (cursor: number | undefined) => {
    return await GetNotifications(dotYouClient, props?.appId, PAGE_SIZE, cursor);
  };

  const markAsRead = async (notificationIds: string[]) =>
    await MarkNotificationsAsRead(dotYouClient, notificationIds);

  const removeNotifications = async (notificationIds: string[]) =>
    await DeleteNotifications(dotYouClient, notificationIds);

  return {
    fetch: useQuery({
      queryKey: ['push-notifications', ''],
      queryFn: () => getNotifications(undefined),
      staleTime: 1000 * 60 * 5, // 5 minutes
      select: (data) => ({
        ...data,
        results: data.results.filter(
          (n) => !props?.appId || stringGuidsEqual(n.options.appId, props.appId)
        ),
      }),
    }),
    markAsRead: useMutation({
      mutationFn: markAsRead,
      onMutate: async () => {
        // TODO
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['push-notifications'] });
      },
    }),
    remove: useMutation({
      mutationFn: removeNotifications,
      onMutate: async () => {
        // TODO
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['push-notifications'] });
      },
    }),
  };
};

export const useUnreadPushNotificationsCount = (props?: { appId?: string }) => {
  const { data: notifications } = usePushNotifications(props).fetch;

  return notifications?.results.filter((n) => n.unread).length ?? 0;
};

export const useRemoveNotifications = (props?: { enabled: boolean; appId?: string }) => {
  const {
    fetch: { data: notifcationsData },
    remove: { mutateAsync: removeListOfNotifications },
  } = usePushNotifications(props);

  useEffect(() => {
    (async () => {
      if (!props?.enabled) return;
      const notifications = notifcationsData?.results;
      if (notifications && notifications?.length > 0) {
        isDebug && console.debug('Removing all notifications', props?.appId);
        await removeListOfNotifications(notifications.map((n) => n.id));
      }
    })();
  }, [notifcationsData, props?.enabled, props?.appId, removeListOfNotifications]);
};
