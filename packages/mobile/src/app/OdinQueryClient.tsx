import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import {
  PersistQueryClientOptions,
  PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';
import { ReactNode, useMemo } from 'react';
import {
  getSendChatMessageMutationOptions,
  getUpdateChatMessageMutationOptions,
} from '../hooks/chat/useChatMessage';
import {
  getAddReactionMutationOptions,
  getRemoveReactionMutationOptions,
} from '../hooks/chat/useChatReaction';
import { getSavePostMutationOptions } from '../hooks/feed/post/useManagePost';
import { tryJsonParse } from '@homebase-id/js-lib/helpers';
import logger from '../provider/log/logger';

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      gcTime: Infinity,
      retry: 1,
    },
    queries: {
      retry: 2,
      gcTime: Infinity,
    },
  },
});

queryClient.setMutationDefaults(
  ['send-chat-message'],
  getSendChatMessageMutationOptions(queryClient)
);
queryClient.setMutationDefaults(
  ['update-chat-message'],
  getUpdateChatMessageMutationOptions(queryClient)
);
queryClient.setMutationDefaults(['add-reaction'], getAddReactionMutationOptions(queryClient));
queryClient.setMutationDefaults(['remove-reaction'], getRemoveReactionMutationOptions(queryClient));
queryClient.setMutationDefaults(['save-post'], getSavePostMutationOptions(queryClient));

// Explicit includes to avoid persisting media items, or large data in general
const INCLUDED_QUERY_KEYS = [
  'chat-message',
  'chat-messages',
  'conversations',
  'conversation-metadata',
  'chat-reaction',
  'connection-details',
  'contacts',
  'contact',
  'profile-data',
  'followers',
  'following',
  'connections', // TODO: 'connections' and 'active-connections' should be merged
  'active-connections',
  'connection-info',
  'pending-connections',
  'conversations-with-recent-message',
  'image',
  'process-inbox',
  'channels',
  'channel',
  'social-feeds',
  'security-context',
  'pending-upgrade',
];

export const OdinQueryClient = ({ children }: { children: ReactNode }) => {
  const persistOptions = useMemo(() => {
    const asyncPersist = createAsyncStoragePersister({
      storage: AsyncStorage,
      throttleTime: 1000,
      key: 'REACT_QUERY_OFFLINE_CACHE',
    });

    const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
      buster: '20241110',
      maxAge: Infinity,
      persister: asyncPersist,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          const isPendingOrFailedQuery =
            query.state.status === 'pending' || query.state.status === 'error';

          const queryDataIsEmptyObject =
            query.state.data &&
            typeof query.state.data === 'object' &&
            !Array.isArray(query.state.data) &&
            Object.keys(query.state.data).length === 0;

          if (isPendingOrFailedQuery || queryDataIsEmptyObject) {
            return false;
          }

          const queryKey = query.queryKey;
          return INCLUDED_QUERY_KEYS.some((key) => queryKey.includes(key));
        },
        serializeData: (data) => {
          // Keep the serialized data small by only including the first two pages of data for infinite queries
          if (data?.pages?.length && data?.pages?.length > 2) {
            const adjustedData = { ...data };
            adjustedData.pages = adjustedData.pages.slice(0, 2);
            return adjustedData;
          }

          return data;
        },
      },
    };

    return persistOptions;
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={() => queryClient.resumePausedMutations()}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
