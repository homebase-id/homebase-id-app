import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useConnection } from './useConnection';
import { AUTO_CONNECTIONS_CIRCLE_ID, ConnectionInfo } from '@homebase-id/js-lib/network';
import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';

const TWO_MINUTES = 1000 * 60 * 2;
export const useAutoConnection = ({ odinId }: { odinId?: string }) => {
  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData<boolean>(['unconfirmed-connection', odinId]);

  const {
    fetch: { data: connectionInfo },
  } = useConnection({ odinId: odinId });

  const isUnconfirmedAutoConnected = async () => {
    if (connectionInfo?.status !== 'connected') return false;
    const info = connectionInfo as ConnectionInfo;

    return info.accessGrant.circleGrants.some((grant) => {
      return stringGuidsEqual(grant.circleId, AUTO_CONNECTIONS_CIRCLE_ID);
    });
  };

  return {
    isUnconfirmedAutoConnected: useQuery({
      queryKey: ['unconfirmed-connection', odinId],
      queryFn: () => isUnconfirmedAutoConnected(),
      refetchOnWindowFocus: false,
      enabled: !!connectionInfo,
    }),
  };
};