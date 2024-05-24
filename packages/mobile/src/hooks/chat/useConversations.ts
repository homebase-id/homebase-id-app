import { UnifiedConversation, getConversations } from '../../provider/chat/ConversationProvider';
import { InfiniteData, QueryClient, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { useCallback, useEffect, useState } from 'react';
import { getChatMessageInfiniteQueryOptions } from './useChatMessages';
import { stringGuidsEqual } from '@youfoundation/js-lib/helpers';

const PAGE_SIZE = 500;

export const useConversations = () => {
  const dotYouClient = useDotYouClientContext();

  const fetchConversations = async (cursorState: string | undefined) => {
    return await getConversations(dotYouClient, cursorState, PAGE_SIZE);
  };

  return {
    all: useInfiniteQuery({
      queryKey: ['conversations'],
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }) => fetchConversations(pageParam),
      getNextPageParam: (lastPage) =>
        lastPage && lastPage.searchResults?.length >= PAGE_SIZE ? lastPage.cursorState : undefined,
      refetchOnMount: false,
      staleTime: 1000 * 60 * 5, // 5min before conversations from another device are fetched on this one
    }),
  };
};

export type ConversationWithRecentMessage = HomebaseFile<UnifiedConversation> & {
  lastMessage: HomebaseFile<ChatMessage> | null;
};

export const useConversationsWithRecentMessage = () => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const { data: conversations, ...rest } = useConversations().all;

  const [conversationsWithRecent, setConversationsWithRecent] = useState<
    ConversationWithRecentMessage[]
  >([]);

  const buildConversationsWithRecent = useCallback(
    async (
      conversations:
        | InfiniteData<
            {
              searchResults: HomebaseFile<UnifiedConversation>[];
              cursorState: string;
              queryTime: number;
              includeMetadataHeader: boolean;
            } | null,
            unknown
          >
        | undefined
    ) => {
      const flatConversations =
        (conversations?.pages
          ?.flatMap((page) => page?.searchResults)
          .filter(
            (convo) => convo && [0, undefined].includes(convo.fileMetadata.appData.archivalStatus)
          ) as ConversationWithRecentMessage[]) || [];

      if (!flatConversations || !flatConversations || flatConversations.length === 0) {
        return flatConversations;
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
      return convoWithMessage;
    },
    [dotYouClient, queryClient]
  );

  useEffect(() => {
    buildConversationsWithRecent(conversations).then((conversationsWithRecent) => {
      setConversationsWithRecent(conversationsWithRecent);
    });
  }, [conversations, buildConversationsWithRecent]);

  return {
    all: {
      ...rest,
      data: conversationsWithRecent,
    },
  };
};

export const insertNewConversation = (
  queryClient: QueryClient,
  newConversation: HomebaseFile<UnifiedConversation>,
  isUpdate?: boolean
) => {
  const extistingConversations = queryClient.getQueryData<
    InfiniteData<{
      searchResults: HomebaseFile<UnifiedConversation>[];
      cursorState: string;
      queryTime: number;
      includeMetadataHeader: boolean;
    }>
  >(['conversations']);

  if (extistingConversations) {
    const isNewFile =
      isUpdate === undefined
        ? !extistingConversations.pages.some((page) =>
            page.searchResults.some((msg) => stringGuidsEqual(msg?.fileId, newConversation.fileId))
          )
        : !isUpdate;

    const newData = {
      ...extistingConversations,
      pages: extistingConversations.pages.map((page, index) => ({
        ...page,
        searchResults: isNewFile
          ? index === 0
            ? [
                newConversation,
                // There shouldn't be any duplicates for a fileAdded, but just in case
                ...page.searchResults.filter(
                  (msg) => !stringGuidsEqual(msg?.fileId, newConversation.fileId)
                ),
              ].sort((a, b) => b.fileMetadata.created - a.fileMetadata.created) // Re-sort the first page, as the new message might be older than the first message in the page;
            : page.searchResults.filter(
                (msg) => !stringGuidsEqual(msg?.fileId, newConversation.fileId)
              ) // There shouldn't be any duplicates for a fileAdded, but just in case
          : page.searchResults.map((conversation) =>
              stringGuidsEqual(
                conversation.fileMetadata.appData.uniqueId,
                newConversation.fileMetadata.appData.uniqueId
              )
                ? newConversation
                : conversation
            ),
      })),
    };
    queryClient.setQueryData(['conversations'], newData);
  } else {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }
};
