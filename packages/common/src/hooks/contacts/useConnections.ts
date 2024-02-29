import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { PagingOptions } from '@youfoundation/js-lib/core';
import { getConnections, getPendingRequests, getSentRequests } from '@youfoundation/js-lib/network';
import { useDotYouClientContext } from '../auth/useDotYouClientContext';

interface useConnectionsProps {
    pageSize: number;
    pageNumber: number;
}

export const usePendingConnections = ({
    pageSize: pendingPageSize,
    pageNumber: pendingPage,
}: useConnectionsProps) => {
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
            queryKey: ['pendingConnections', pendingPageSize, pendingPage],
            queryFn: () =>
                fetchPendingConnections({ pageSize: pendingPageSize, pageNumber: pendingPage }),

            refetchOnWindowFocus: false,
            refetchOnMount: false,
            enabled: !!pendingPage,
        }),
    };
};

export const useSentConnections = ({
    pageSize: sentPageSize,
    pageNumber: sentPage,
}: useConnectionsProps) => {
    const dotYouClient = useDotYouClientContext();

    const fetchSentRequests = async (
        { pageSize, pageNumber }: PagingOptions = { pageSize: 10, pageNumber: 1 }
    ) => {
        return await await getSentRequests(dotYouClient, {
            pageNumber: pageNumber,
            pageSize: pageSize,
        });
    };

    return {
        fetch: useQuery({
            queryKey: ['sentRequests', sentPageSize, sentPage],
            queryFn: () => fetchSentRequests({ pageSize: sentPageSize, pageNumber: sentPage }),
            refetchOnWindowFocus: false,
            enabled: !!sentPage,
        }),
    };
};

interface useActiveConnectionsProps {
    pageSize: number;
    cursor?: number;
}

export const useActiveConnections = (
    { pageSize: activePageSize, cursor: activePage }: useActiveConnectionsProps = {
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
                cursor: cursor ?? undefined,
                count: pageSize,
            });
        } catch (ex) {
            return {
                cursor: undefined,
                results: [],
            };
        }
    };

    return {
        fetch: useInfiniteQuery({
            queryKey: ['activeConnections', activePageSize, activePage],
            initialPageParam: undefined as number | undefined,
            queryFn: ({ pageParam }) => fetchConnections({ pageSize: activePageSize, cursor: pageParam }),
            getNextPageParam: (lastPage) =>
                lastPage.results?.length >= activePageSize ? lastPage.cursor : undefined,
            refetchOnWindowFocus: false,
        }),
    };
};
