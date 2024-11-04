import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { getDetailedConnectionInfo } from '@homebase-id/js-lib/network';

export const useConnection = ({ odinId }: { odinId?: string }) => {
  const dotYouClient = useAuth().getDotYouClient();

  const doGetConnectionInfo = async (odinId: string) => {
    return (await getDetailedConnectionInfo(dotYouClient, odinId as string)) || null;
  };

  return {
    fetch: useQuery({
      queryKey: ['connection-info', odinId],
      queryFn: () => doGetConnectionInfo(odinId as string),
      refetchOnWindowFocus: false,
      enabled: !!odinId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),
  };
};
