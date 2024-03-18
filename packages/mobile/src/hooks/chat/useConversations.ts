
import { Conversation, getConversations } from '../../provider/chat/ConversationProvider';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
import { ChatMessage, getChatMessages } from '../../provider/chat/ChatProvider';

const PAGE_SIZE = 500;

export type ConversationWithRecentMessage = DriveSearchResult<Conversation> & {
  lastMessage: DriveSearchResult<ChatMessage> | null;
};
export const useConversations = () => {

  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const fetchConversations = async (cursorState: string | undefined) => {
    const fetchedConversations = await getConversations(dotYouClient, cursorState, PAGE_SIZE);
    if (!fetchedConversations.searchResults || fetchedConversations.searchResults.length === 0) {

      return {
        ...fetchedConversations,
        searchResults: [] as ConversationWithRecentMessage[],
      };
    }

    const convoWithMessage = await Promise.all(
      (fetchedConversations.searchResults.filter(Boolean) as DriveSearchResult<Conversation>[]).map(async (convo) => {
        const conversationId = convo.fileMetadata.appData.uniqueId;
        const messagesA = await queryClient.fetchInfiniteQuery({
          queryKey: ['chat', conversationId],
          initialPageParam: undefined,
          queryFn: () => getChatMessages(dotYouClient, conversationId as string, undefined, 10),
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
    return {
      ...fetchedConversations,
      searchResults: convoWithMessage,
    };
  };

  return {
    all: useInfiniteQuery({
      queryKey: ['conversations'],
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }) => fetchConversations(pageParam),
      getNextPageParam: (lastPage) =>
        lastPage.searchResults?.length >= PAGE_SIZE ? lastPage.cursorState : undefined,
      refetchOnMount: false,
      gcTime: 1000 * 60 * 60
    }),
  };
};
