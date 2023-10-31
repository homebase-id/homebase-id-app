import { useQuery } from '@tanstack/react-query';

import useAuth from '../auth/useAuth';
import { ContactFile, getContactByOdinId } from '@youfoundation/js-lib/network';

const useContact = (odinId?: string) => {
  const dotYouClient = useAuth().getDotYouClient();

  const fetchSingle = async (
    _odinId: string,
  ): Promise<ContactFile | undefined> => {
    // Direct fetch with odinId:
    return await getContactByOdinId(dotYouClient, _odinId);
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
