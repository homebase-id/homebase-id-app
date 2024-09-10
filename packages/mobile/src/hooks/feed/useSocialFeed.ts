import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { BlogConfig } from '@homebase-id/js-lib/public';
import { TypedConnectionNotification } from '@homebase-id/js-lib/core';
import { getSocialFeed, processInbox } from '@homebase-id/js-lib/peer';
import { useCallback, useMemo } from 'react';
import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { useChannels } from './channels/useChannels';

import { useChannelDrives } from './channels/useChannelDrives';
import { useDotYouClientContext } from 'feed-app-common';
import { useNotificationSubscriber } from '../useNotificationSubscriber';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { useDriveSubscriber } from '../drive/useDriveSubscriber';

const MINUTE_IN_MS = 60000;

// Process the inbox on startup
const useInboxProcessor = (isEnabled?: boolean) => {
  const { data: chnlDrives, isFetchedAfterMount: channelsFetched } = useChannelDrives(!!isEnabled);
  const dotYouClient = useDotYouClientContext();

  const fetchData = async () => {
    await processInbox(dotYouClient, BlogConfig.FeedDrive, 100);
    if (chnlDrives) {
      await Promise.all(
        chnlDrives.map(async (chnlDrive) => {
          return await processInbox(dotYouClient, chnlDrive.targetDriveInfo, 100);
        })
      );
    }
    return true;
  };

  return useQuery({
    queryKey: ['process-inbox-feed'],
    queryFn: fetchData,
    refetchOnMount: false,
    // We want to refetch on window focus, as we might have missed some messages while the window was not focused and the websocket might have lost connection
    refetchOnWindowFocus: true,
    staleTime: MINUTE_IN_MS * 5,
    enabled: channelsFetched,
  });
};

const useFeedWebsocket = (isEnabled: boolean) => {
  const queryClient = useQueryClient();
  const { data: channelDrives, isFetched } = useDriveSubscriber();
  const subscribedDrives = useMemo(() => {
    return [ChatDrive, BlogConfig.FeedDrive, BlogConfig.PublicChannelDrive, ...(channelDrives ?? [])];
  }, [channelDrives]);

  const handler = useCallback(
    (notification: TypedConnectionNotification) => {
      if (
        (notification.notificationType === 'fileAdded' ||
          notification.notificationType === 'fileModified')
      ) {
        if (subscribedDrives.slice(1).some((drive) => stringGuidsEqual(drive.alias, notification.targetDrive?.alias) && stringGuidsEqual(drive.type, notification.targetDrive?.type))) {
          queryClient.invalidateQueries({ queryKey: ['social-feeds'] });
        }
      }
    },
    [queryClient, subscribedDrives]
  );
  console.log('useFeedWebsocket', isEnabled, isFetched);
  return useNotificationSubscriber(
    isEnabled && isFetched ? handler : undefined,
    ['fileAdded', 'fileModified'],
    subscribedDrives,
    () => {
      queryClient.invalidateQueries({ queryKey: ['process-inbox-feed'] });
    }
  );
};

export const useLiveFeedProcessor = () => {
  const { status: inboxStatus } = useInboxProcessor(true);

  const isOnline = useFeedWebsocket(inboxStatus === 'success');
  return isOnline;
};

export const useSocialFeed = ({ pageSize = 10 }: { pageSize: number }) => {
  const dotYouClient = useDotYouClientContext();

  const { data: ownChannels, isFetched: channelsFetched } = useChannels({
    isAuthenticated: true,
    isOwner: true,
  });

  const fetchAll = async ({
    pageParam,
  }: {
    pageParam?: { cursorState?: string; ownerCursorState?: Record<string, string> };
  }) => {
    return await getSocialFeed(dotYouClient, pageSize, pageParam?.cursorState, {
      ownCursorState: pageParam?.ownerCursorState,
      ownChannels,
    });
  };

  return {
    fetchAll: useInfiniteQuery({
      queryKey: ['social-feeds'],
      initialPageParam: undefined as
        | { cursorState?: string; ownerCursorState?: Record<string, string> }
        | undefined,
      queryFn: ({ pageParam }) => fetchAll({ pageParam }),
      getNextPageParam: (lastPage) =>
        lastPage &&
          lastPage?.results?.length >= 1 &&
          (lastPage?.cursorState || lastPage?.ownerCursorState)
          ? { cursorState: lastPage.cursorState, ownerCursorState: lastPage.ownerCursorState }
          : undefined,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      enabled: channelsFetched,
      staleTime: MINUTE_IN_MS * 1,
    }),
  };
};
