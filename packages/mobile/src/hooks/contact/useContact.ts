import { useQuery } from '@tanstack/react-query';

import { ContactFile, getContactByOdinId } from '@homebase-id/js-lib/network';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import { useDotYouClientContext } from 'homebase-id-app-common';

const useContact = (odinId?: string) => {
  const dotYouClient = useDotYouClientContext();

  const fetchSingle = async (_odinId: string): Promise<HomebaseFile<ContactFile> | null> => {
    // Direct fetch with odinId:
    return (await getContactByOdinId(dotYouClient, _odinId)) || null;
  };

  return {
    fetch: useQuery({
      queryKey: ['contact', odinId],
      queryFn: () => fetchSingle(odinId as string),
      staleTime: 1000 * 60 * 60 * 24, // 1 day
      enabled: !!odinId,
    }),
  };
};
export default useContact;
