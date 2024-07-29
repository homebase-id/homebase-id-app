import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import {
  PersistQueryClientOptions,
  PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';
import { ReactNode } from 'react';
import {
  getSendChatMessageMutationOptions,
  getUpdateChatMessageMutationOptions,
} from '../hooks/chat/useChatMessage';
import {
  getAddReactionMutationOptions,
  getRemoveReactionMutationOptions,
} from '../hooks/chat/useChatReaction';
import { getSavePostMutationOptions } from '../hooks/feed/post/usePost';

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

const asyncPersist = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

// Explicit includes to avoid persisting media items, or large data in general
const INCLUDED_QUERY_KEYS = [
  'chat-message',
  'chat-messages',
  'conversations',
  'conversation-metadata',
  'chat-reaction',
  'connection-details',
  'contact',
  'profile-data',
  'followers',
  'following',
  'active-connections',
  'pending-connections',
  'contacts',

  // Small data (blobs to local file Uri)
  'image',

  // Big data (base64 uri's)
  // 'tinyThumb',

  'process-inbox',
];
const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  buster: '20240524',
  maxAge: Infinity,
  persister: asyncPersist,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      if (
        query.state.status === 'pending' ||
        query.state.status === 'error' ||
        (query.state.data &&
          typeof query.state.data === 'object' &&
          !Array.isArray(query.state.data) &&
          Object.keys(query.state.data).length === 0)
      ) {
        return false;
      }
      const { queryKey } = query;
      return INCLUDED_QUERY_KEYS.some((key) => queryKey.includes(key));
    },
  },
};

export const OdinQueryClient = ({ children }: { children: ReactNode }) => {
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
