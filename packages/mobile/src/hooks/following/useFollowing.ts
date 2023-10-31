import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFollowing } from '@youfoundation/js-lib/network';
import useAuth from '../auth/useAuth';

type useFollowingInfiniteProps = {
  pageSize?: number;
};

export const useFollowingInfinite = ({
  pageSize = 30,
}: useFollowingInfiniteProps) => {
  const dotYouClient = useAuth().getDotYouClient();

  const fetchFollowingInternal = async ({
    pageParam,
  }: {
    pageParam?: string;
  }) => {
    const response = await fetchFollowing(dotYouClient, pageParam);
    if (response) return response;
  };

  return {
    fetch: useInfiniteQuery({
      queryKey: ['following'],
      initialPageParam: undefined as string | undefined,
      queryFn: ({ pageParam }) => fetchFollowingInternal({ pageParam }),
      getNextPageParam: lastPage =>
        lastPage?.results?.length && lastPage?.results?.length >= pageSize
          ? lastPage?.cursorState
          : undefined,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }),
  };
};
