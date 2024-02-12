import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFollowers } from '@youfoundation/js-lib/network';
import { useDotYouClientContext } from 'feed-app-common';

type useFollowerInfiniteProps = {
  pageSize?: number;
};

export const useFollowerInfinite = ({ pageSize = 30 }: useFollowerInfiniteProps) => {
  const dotYouClient = useDotYouClientContext();

  const fetchBlogData = async ({ pageParam }: { pageParam?: string }) => {
    const response = await fetchFollowers(dotYouClient, pageParam);
    return response;
  };

  return {
    fetch: useInfiniteQuery({
      queryKey: ['followers'],
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }) => fetchBlogData({ pageParam }),
      getNextPageParam: (lastPage) =>
        lastPage?.results && lastPage.results.length >= pageSize
          ? lastPage?.cursorState
          : undefined,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }),
  };
};
