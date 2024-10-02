import { getConnections } from '@homebase-id/js-lib/network';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDotYouClientContext } from 'homebase-id-app-common';

interface useConnectionsProps {
  pageSize?: number;
}

export const useConnections = (
  { pageSize: activePageSize = 30 }: useConnectionsProps = {
    pageSize: 10,
  }
) => {
  const dotYouClient = useDotYouClientContext();

  const fetchConnections = async (
    { pageSize, cursor }: { pageSize: number; cursor?: number } = {
      pageSize: 10,
    }
  ) => {
    try {
      return await getConnections(dotYouClient, {
        cursor: cursor ?? 0,
        count: pageSize,
      });
    } catch (ex) {
      return {
        cursor: undefined,
        results: [],
      };
    }
  };

  // TODO: needs to get merged with useAllConnections
  return {
    fetch: useInfiniteQuery({
      queryKey: ['active-connections', activePageSize],
      initialPageParam: undefined as number | undefined,
      queryFn: ({ pageParam }) => fetchConnections({ pageSize: activePageSize, cursor: pageParam }),

      getNextPageParam: (lastPage) =>
        lastPage.results?.length >= activePageSize ? lastPage.cursor : undefined,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60 * 24 * 1, // 1 day
    }),
  };
};
