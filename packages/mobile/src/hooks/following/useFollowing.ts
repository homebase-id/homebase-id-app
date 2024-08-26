import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFollowing } from '@homebase-id/js-lib/network';
import { useDotYouClientContext } from 'feed-app-common';

type useFollowingInfiniteProps = {
  pageSize?: number;
};

export const useFollowingInfinite = ({ pageSize = 30 }: useFollowingInfiniteProps) => {
  const dotYouClient = useDotYouClientContext();

  const fetchFollowingInternal = async ({ pageParam }: { pageParam?: string }) => {
    const response = await fetchFollowing(dotYouClient, pageParam);
    if (response) return response;
  };

  return {
    fetch: useInfiniteQuery({
      queryKey: ['following'],
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }) => fetchFollowingInternal({ pageParam }),
      getNextPageParam: (lastPage) =>
        lastPage?.results?.length && lastPage?.results?.length >= pageSize
          ? lastPage?.cursorState
          : undefined,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60 * 24 * 1,
    }),
  };
};
