import { useQuery } from '@tanstack/react-query';
import { getDomainFromUrl } from '@youfoundation/js-lib/helpers';
import axios from 'axios';

export const useCheckIdentity = (odinId?: string) => {
  return useQuery({
    queryKey: ['check-identity', odinId],
    queryFn: () => doCheckIdentity(odinId),
  });
};

export const doCheckIdentity = async (odinId?: string) => {
  if (!odinId) return false;
  const strippedIdentity = getDomainFromUrl(odinId);

  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]{2,25}(?::\d{1,5})?$/i;
  const isValid = domainRegex.test(strippedIdentity || '');
  if (!isValid) return false;

  return await axios
    .get(`https://${strippedIdentity}/api/guest/v1/auth/ident`)
    .then((res) => res.data)
    .then((validation) => validation?.odinId.toLowerCase() === strippedIdentity)
    .catch(() => false);
};
