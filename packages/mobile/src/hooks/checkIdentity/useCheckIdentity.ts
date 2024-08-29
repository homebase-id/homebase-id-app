import { useQuery } from '@tanstack/react-query';
import { getDomainFromUrl } from '@homebase-id/js-lib/helpers';
import axios from 'axios';

const MINUTE_IN_MS = 60000;

export const useCheckIdentity = (odinId?: string) => {
  return useQuery({
    queryKey: ['check-identity', odinId],
    queryFn: () => doCheckIdentity(odinId),
    staleTime: MINUTE_IN_MS,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
};

export const doCheckIdentity = async (odinId?: string) => {
  if (!odinId) return false;
  const strippedIdentity = getDomainFromUrl(odinId);

  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]{2,25}(?::\d{1,5})?$/i;
  const isValid = domainRegex.test(strippedIdentity || '');
  if (!isValid) return false;

  try {
    const url = `https://${strippedIdentity}/api/guest/v1/auth/ident`;
    // console.debug(`Checking identity: ${url}`);
    const response = await axios.get(url);
    const validation = response.data;
    return validation?.odinId.toLowerCase() === strippedIdentity;
  } catch (error) {
    console.debug('Error checking identity', error);
    return false;
  }
};
