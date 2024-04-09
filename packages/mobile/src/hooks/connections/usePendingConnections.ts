import { useQuery } from '@tanstack/react-query';
import { getPendingRequests } from '@youfoundation/js-lib/network';
import { PagingOptions } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';

interface useConnectionsProps {
  pageSize: number;
  pageNumber: number;
}

export const usePendingConnections = (props?: useConnectionsProps) => {
  const { pageSize: pendingPageSize, pageNumber: pendingPage } = props || {
    pageSize: 10,
    pageNumber: 1,
  };
  const dotYouClient = useDotYouClientContext();

  const fetchPendingConnections = async (
    { pageSize, pageNumber }: PagingOptions = { pageSize: 10, pageNumber: 1 }
  ) => {
    return (
      (await getPendingRequests(dotYouClient, {
        pageNumber: pageNumber,
        pageSize: pageSize,
      })) || null
    );
  };

  return {
    fetch: useQuery({
      queryKey: ['pending-connections', pendingPageSize, pendingPage],
      queryFn: () =>
        fetchPendingConnections({ pageSize: pendingPageSize, pageNumber: pendingPage }),

      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: !!pendingPage,
      staleTime: 1000 * 60 * 60 * 24 * 1,
    }),
  };
};
