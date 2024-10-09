import { DotYouProfile, getConnections } from '@homebase-id/js-lib/network';

import { useQuery } from '@tanstack/react-query';
import { useDotYouClientContext } from '../auth/useDotYouClientContext';

const CHUNKSIZE = 200;
export const useAllConnections = (enabled: boolean) => {
  const dotYouClient = useDotYouClientContext();

  const fetchConnections = async () => {
    // self invoking function that fetches the contacts in blocks of a CHUNKSIZE untill there are no more contacts to fetch
    const internalGetConnections = async (
      cursor: number | undefined,
      limit: number
    ): Promise<DotYouProfile[]> => {
      const connections = await getConnections(dotYouClient, { cursor, count: limit });
      if (connections?.cursor && connections.results.length >= limit) {
        const nextContacts = await internalGetConnections(connections.cursor, limit);
        return connections.results.concat(nextContacts);
      }
      return connections.results;
    };

    const allConnections = await internalGetConnections(undefined, CHUNKSIZE);
    return allConnections.sort((a, b) => a.odinId.localeCompare(b.odinId));
  };

  // TODO: needs to get merged with useConnections
  return useQuery({
    queryKey: ['connections'],
    queryFn: fetchConnections,
    staleTime: 1000 * 60 * 5, // 5min before contacts from another device are fetched on this one
    enabled,
  });
};
