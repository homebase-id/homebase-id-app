import { useQuery } from '@tanstack/react-query';
import { ApiType, getSecurityContext, getSecurityContextOverPeer } from '@homebase-id/js-lib/core';
import { useDotYouClientContext } from '../auth/useDotYouClientContext';

export const useSecurityContext = (odinId?: string, isEnabled?: boolean) => {
  const dotYouClient = useDotYouClientContext();

  const fetch = async (odinId?: string) => {
    if (
      !odinId ||
      (dotYouClient.getType() === ApiType.App && odinId === dotYouClient.getIdentity())
    ) {
      return await getSecurityContext(dotYouClient);
    } else return await getSecurityContextOverPeer(dotYouClient, odinId);
  };

  return {
    fetch: useQuery({
      queryKey: ['security-context', odinId],
      queryFn: () => fetch(odinId),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      enabled: isEnabled === undefined ? true : isEnabled,
    }),
  };
};
