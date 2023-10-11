import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchFollowers } from '@youfoundation/js-lib/network';
import useAuth from '../auth/useAuth';

type useFollowerInfiniteProps = {
  pageSize?: number;
};

export const useFollowerInfinite = ({
  pageSize = 30,
}: useFollowerInfiniteProps) => {
  const dotYouClient = useAuth().getDotYouClient();

  const fetchBlogData = async ({ pageParam }: { pageParam?: string }) => {
    const response = await fetchFollowers(dotYouClient, pageParam);
    return response;
  };

  return {
    fetch: useInfiniteQuery(
      ['followers'],
      ({ pageParam }) => fetchBlogData({ pageParam }),
      {
        getNextPageParam: lastPage =>
          (lastPage?.results &&
            lastPage.results.length >= pageSize &&
            lastPage?.cursorState) ??
          undefined,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
      },
    ),
  };
};
