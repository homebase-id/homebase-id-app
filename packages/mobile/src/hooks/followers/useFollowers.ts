import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFollowers } from '@homebase-id/js-lib/network';
import { useDotYouClientContext } from 'homebase-id-app-common';

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
      staleTime: 1000 * 60 * 60 * 24 * 1, // 1 day
    }),
  };
};
