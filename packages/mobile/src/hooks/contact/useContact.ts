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
    fetch: useQuery(['contact', odinId], () => fetchSingle(odinId as string), {
      refetchOnWindowFocus: false,
      onError: err => console.error(err),
      retry: false,
      enabled: !!odinId,
    }),
  };
};
export default useContact;
