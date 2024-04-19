import { useQuery } from '@tanstack/react-query';
import { getCircles } from '@youfoundation/js-lib/network';
import { useDotYouClientContext } from 'feed-app-common';

export const useCircles = (excludeSystemCircles = false) => {
  const dotYouClient = useDotYouClientContext();

  const fetchAll = async () => {
    const circles = await getCircles(dotYouClient, excludeSystemCircles);
    return circles?.sort((a, b) => (a.disabled ? 1 : 0) - (b.disabled ? 1 : 0));
  };

  return {
    fetch: useQuery({
      queryKey: ['circles', excludeSystemCircles],
      queryFn: () => fetchAll(),
      refetchOnWindowFocus: false,
    }),
  };
};
