
import { getConversations } from '../../provider/chat/ConversationProvider';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDotYouClientContext } from 'feed-app-common';

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
        lastPage.searchResults?.length >= PAGE_SIZE ? lastPage.cursorState : undefined,
      refetchOnMount: false,
    }),
  };
};
