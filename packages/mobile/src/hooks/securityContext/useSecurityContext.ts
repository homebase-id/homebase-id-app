import { useQuery } from '@tanstack/react-query';
import { getSecurityContext, getSecurityContextOverPeer } from '@homebase-id/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';

export const useSecurityContext = (odinId?: string, isEnabled?: boolean) => {
  const dotYouClient = useDotYouClientContext();

  const fetch = async (odinId?: string) => {
    if (!odinId || odinId === dotYouClient.getIdentity()) {
      return await getSecurityContext(dotYouClient);
    } else return await getSecurityContextOverPeer(dotYouClient, odinId);
  };

  return {
    fetch: useQuery({
      queryKey: ['security-context', odinId],
      queryFn: () => fetch(odinId),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      enabled: isEnabled || true,
    }),
  };
};
