import { useQuery } from '@tanstack/react-query';

import { ContactFile, getContactByOdinId } from '@youfoundation/js-lib/network';
import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';

const useContact = (odinId?: string) => {
  const dotYouClient = useDotYouClientContext();

  const fetchSingle = async (_odinId: string): Promise<DriveSearchResult<ContactFile> | null> => {
    // Direct fetch with odinId:
    return (await getContactByOdinId(dotYouClient, _odinId)) || null;
  };

  return {
    fetch: useQuery({
      queryKey: ['contact', odinId],
      queryFn: () => fetchSingle(odinId as string),
      refetchOnWindowFocus: false,
      retry: false,
      enabled: !!odinId,
    }),
  };
};
export default useContact;
