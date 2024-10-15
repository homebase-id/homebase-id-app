import { useQuery } from '@tanstack/react-query';
import { GetProfileCard } from '@homebase-id/js-lib/public';
import { t } from 'homebase-id-app-common';
import { addLogs } from '../../provider/log/logger';
import { generateClientError } from '../errors/useErrors';

export const useExternalOdinId = ({ odinId }: { odinId?: string }) => {
  const fetchSingle = async ({ odinId }: { odinId?: string }) => {
    if (!odinId) return;
    return (await GetProfileCard(odinId)) || null;
  };

  return {
    fetch: useQuery({
      queryKey: ['connection-details', odinId],
      queryFn: () => fetchSingle({ odinId }),
      throwOnError: (error, _) => {
        const newError = generateClientError(error, t('Failed to get connection details'));
        addLogs(newError);
        return false;
      },
      refetchOnWindowFocus: false,
      enabled: !!odinId,
    }),
  };
};
