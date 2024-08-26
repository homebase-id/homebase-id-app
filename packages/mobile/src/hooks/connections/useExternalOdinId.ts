import { useQuery } from '@tanstack/react-query';
import { GetProfileCard } from '@homebase-id/js-lib/public';

export const useExternalOdinId = ({ odinId }: { odinId?: string }) => {
  const fetchSingle = async ({ odinId }: { odinId?: string }) => {
    if (!odinId) return;
    return (await GetProfileCard(odinId)) || null;
  };

  return {
    fetch: useQuery({
      queryKey: ['connection-details', odinId],
      queryFn: () => fetchSingle({ odinId }),
      refetchOnWindowFocus: false,
      enabled: !!odinId,
    }),
  };
};
