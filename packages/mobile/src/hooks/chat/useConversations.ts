import { Conversation, getConversations } from '../../provider/chat/ConversationProvider';
import { InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
import { ChatMessage, getChatMessages } from '../../provider/chat/ChatProvider';
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 500;

export const useConversations = () => {
  const dotYouClient = useDotYouClientContext();

  const fetchConversations = async (cursorState: string | undefined) =>
    await getConversations(dotYouClient, cursorState, PAGE_SIZE);

  return {
    all: useInfiniteQuery({
      queryKey: ['conversations'],
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }) => fetchConversations(pageParam),
      getNextPageParam: (lastPage) =>
        lastPage.searchResults?.length >= PAGE_SIZE ? lastPage.cursorState : undefined,
      refetchOnMount: false,
      staleTime: 1000 * 60 * 5,
    }),
  };
};

export type ConversationWithRecentMessage = HomebaseFile<Conversation> & {
  lastMessage: HomebaseFile<ChatMessage> | null;
};

export const useConversationsWithRecentMessage = () => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const useConversationsQuery = useConversations();
  const { data: conversations, ...rest } = useConversationsQuery.all;

  const [conversationsWithRecent, setConversationsWithRecent] = useState<
    ConversationWithRecentMessage[]
  >([]);

  const fetchConversations = useCallback(
    async (
      conversations:
        | InfiniteData<
            {
              searchResults: (HomebaseFile<Conversation> | null)[];
              cursorState: string;
              queryTime: number;
              includeMetadataHeader: boolean;
            },
            unknown
          >
        | undefined
    ) => {
      const flatConversations =
        (conversations?.pages
          ?.flatMap((page) => page.searchResults)
          .filter(
            (convo) => convo && [0, undefined].includes(convo.fileMetadata.appData.archivalStatus)
          ) as ConversationWithRecentMessage[]) || [];

      if (!flatConversations || !flatConversations || flatConversations.length === 0) {
        return flatConversations;
      }

      const convoWithMessage: ConversationWithRecentMessage[] = await Promise.all(
        (flatConversations.filter(Boolean) as HomebaseFile<Conversation>[]).map(async (convo) => {
          const conversationId = convo.fileMetadata.appData.uniqueId;
          const messagesA = await queryClient.fetchInfiniteQuery({
            queryKey: ['chat-messages', conversationId],
            initialPageParam: undefined,
            queryFn: () => getChatMessages(dotYouClient, conversationId as string, undefined, 100),
          });
          return {
            ...convo,
            lastMessage: messagesA.pages[0].searchResults[0],
          };
        })
      );

      convoWithMessage.sort((a, b) => {
        if (!a.lastMessage) return -1;
        if (!b.lastMessage) return 1;
        return b.lastMessage.fileMetadata.created - a.lastMessage.fileMetadata.created;
      });
      return convoWithMessage;
    },
    [dotYouClient, queryClient]
  );

  useEffect(() => {
    fetchConversations(conversations).then((conversationsWithRecent) => {
      setConversationsWithRecent(conversationsWithRecent);
    });
  }, [conversations, fetchConversations]);

  return {
    all: {
      ...rest,
      data: conversationsWithRecent,
    },
  };
};
