import { UnifiedConversation, getConversations } from '../../provider/chat/ConversationProvider';
import { InfiniteData, QueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
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
