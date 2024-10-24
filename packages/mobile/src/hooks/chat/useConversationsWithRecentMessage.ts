import { UnifiedConversation } from '../../provider/chat/ConversationProvider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getChatMessageInfiniteQueryOptions } from './useChatMessages';
import { useFocusEffect } from '@react-navigation/native';
import { useConversations } from './useConversations';
import { generateClientError } from '../errors/useErrors';
import { addLogs } from '../../provider/log/logger';

export type ConversationWithRecentMessage = HomebaseFile<UnifiedConversation> & {
  lastMessage: HomebaseFile<ChatMessage> | null;
};
export const useConversationsWithRecentMessage = () => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const { data: conversations } = useConversations().all;

  const flatConversations = useMemo(
    () =>
      (conversations?.pages
        ?.flatMap((page) => page?.searchResults)
        .filter(
          (convo) => convo && [0, undefined].includes(convo.fileMetadata.appData.archivalStatus)
        ) as ConversationWithRecentMessage[]) || [],
    [conversations]
  );

  const buildConversationsWithRecent = useCallback(async () => {
    if (!flatConversations || !flatConversations || flatConversations.length === 0) {
      return;
    }

    const convoWithMessage: ConversationWithRecentMessage[] = await Promise.all(
      (flatConversations.filter(Boolean) as HomebaseFile<UnifiedConversation>[]).map(
        async (convo) => {
          const conversationId = convo.fileMetadata.appData.uniqueId;
          const messagesA = await queryClient.fetchInfiniteQuery(
            getChatMessageInfiniteQueryOptions(dotYouClient, conversationId)
          );
          return {
            ...convo,
            lastMessage: messagesA.pages[0].searchResults[0],
          };
        }
      )
    );

    convoWithMessage.sort((a, b) => {
      if (!a.lastMessage) return -1;
      if (!b.lastMessage) return 1;
      return b.lastMessage.fileMetadata.created - a.lastMessage.fileMetadata.created;
    });

    queryClient.setQueryData(['conversations-with-recent-message'], convoWithMessage);
  }, [flatConversations, dotYouClient, queryClient]);

  const { lastUpdate } = useLastUpdatedChatMessages();
  useEffect(() => {
    if (lastUpdate === null) return;
    buildConversationsWithRecent();
  }, [lastUpdate, buildConversationsWithRecent]);

  return {
    // We only setup a cache entry that we will fill up with the setQueryData later; So we can cache the data for offline and faster startup;
    all: useQuery({
      queryKey: ['conversations-with-recent-message'],
      queryFn: () => [] as ConversationWithRecentMessage[],
      throwOnError: (error, _) => {
        const newError = generateClientError(error, t('Failed to get conversations with recent message'));
        addLogs(newError);
        return false;
      },
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }),
  };
};

const useLastUpdatedChatMessages = () => {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useFocusEffect(() => {
    const lastUpdates = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['chat-messages'], exact: false })
      .map((query) => query.state.dataUpdatedAt);

    setLastUpdate(
      lastUpdates.reduce((acc, val) => {
        if (val > acc) {
          return val;
        }

        return acc;
      }, 0)
    );
  });

  return {
    lastUpdate,
  };
};
