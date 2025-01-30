import {
  ContactFile,
  DotYouProfile,
  getConnections,
  getContactByOdinId,
} from '@homebase-id/js-lib/network';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDotYouClientContext } from '../auth/useDotYouClientContext';
import { HomebaseFile } from '@homebase-id/js-lib/core';

const CHUNKSIZE = 200;
export const useAllConnections = (enabled: boolean) => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const fetchConnections = async () => {
    // self invoking function that fetches the contacts in blocks of a CHUNKSIZE untill there are no more contacts to fetch
    const internalGetConnections = async (
      cursor: unknown | undefined,
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

    const getContactDataAndUpdateCache = async (connection: DotYouProfile) =>
      await queryClient.fetchQuery({
        queryKey: ['contact', connection.odinId],
        queryFn: () => getContactByOdinId(dotYouClient, connection.odinId),
      });

    const allContactsData = (
      await Promise.all(allConnections.map(getContactDataAndUpdateCache))
    ).filter(Boolean) as HomebaseFile<ContactFile>[];
    return allContactsData
      .sort((contacta, contactB) => {
        const a = contacta?.fileMetadata.appData.content;
        const b = contactB?.fileMetadata.appData.content;
        if (!a || !b) return 0;
        return (
          (a.name?.displayName || a.odinId || '').localeCompare(
            b.name?.displayName || b.odinId || ''
          ) || 0
        );
      })
      .map(
        (contact) =>
          allConnections.find(
            (connection) => connection.odinId === contact.fileMetadata.appData.content.odinId
          ) as DotYouProfile
      );
  };

  // TODO: needs to get merged with useConnections
  return useQuery({
    queryKey: ['connections'],
    queryFn: fetchConnections,
    staleTime: 1000 * 60 * 5, // 5min before contacts from another device are fetched on this one
    enabled,
  });
};
