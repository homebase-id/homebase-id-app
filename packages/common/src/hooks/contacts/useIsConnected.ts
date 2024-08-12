import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ConnectionInfo,
  ConnectionRequest,
  getConnectionInfo,
} from '@youfoundation/js-lib/network';
import { useDotYouClientContext } from '../auth/useDotYouClientContext';

export const useIsConnected = (odinId?: string) => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const getIsConnected = async (odinId: string) => {
    const fullConnectionInfo = queryClient.getQueryData<ConnectionInfo | ConnectionRequest | null>([
      'connection-info',
      odinId,
    ]);
    if (fullConnectionInfo?.status === 'connected') return true;
    const connectionInfo = await getConnectionInfo(dotYouClient, odinId);
    return connectionInfo && connectionInfo.status.toLowerCase() === 'connected';

  };

  return useQuery({
    queryKey: ['isConnected', odinId],
    queryFn: () => getIsConnected(odinId as string),
    enabled: !!odinId,
    gcTime: 10 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
