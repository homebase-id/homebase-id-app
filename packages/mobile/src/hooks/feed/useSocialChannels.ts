import { useQuery } from '@tanstack/react-query';
import { getChannelsOverPeer } from '@homebase-id/js-lib/peer';
import { useDotYouClientContext } from 'homebase-id-app-common';

interface useSocialChannelsProps {
  odinId?: string;
}

export const useSocialChannels = ({ odinId }: useSocialChannelsProps) => {
  const dotYouClient = useDotYouClientContext();

  const fetch = async ({ odinId }: useSocialChannelsProps) => {
    if (!odinId) {
      return;
    }
    return await getChannelsOverPeer(dotYouClient, odinId);
  };

  return {
    fetch: useQuery({
      queryKey: ['channels', odinId],
      queryFn: () => fetch({ odinId }),
      enabled: !!odinId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 1,
    }),
  };
};
