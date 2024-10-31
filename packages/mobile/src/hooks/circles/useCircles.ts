import { useQuery } from '@tanstack/react-query';
import { getCircles } from '@homebase-id/js-lib/network';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { addLogs } from '../../provider/log/logger';
import { generateClientError } from '../errors/useErrors';

export const useCircles = (excludeSystemCircles = false) => {
  const dotYouClient = useDotYouClientContext();

  const fetchAll = async () => {
    const circles = await getCircles(dotYouClient, excludeSystemCircles);
    return circles?.sort((a, b) => (a.disabled ? 1 : 0) - (b.disabled ? 1 : 0));
  };

  return {
    fetch: useQuery({
      queryKey: ['circles', excludeSystemCircles],
      throwOnError: (error, _) => {
        const newError = generateClientError(error, t('Something went wrong fetching circles'));
        addLogs(newError);
        return false;
      },
      queryFn: () => fetchAll(),
      refetchOnWindowFocus: false,
    }),
  };
};
