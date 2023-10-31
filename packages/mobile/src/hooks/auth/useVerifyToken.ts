import { useQuery } from '@tanstack/react-query';
import { hasValidToken } from '@youfoundation/js-lib/auth';
import { useEncrtypedStorage } from './useEncryptedStorage';
import { DotYouClient } from '@youfoundation/js-lib/core';

const MINUTE_IN_MS = 60000;

const useVerifyToken = (dotYouClient: DotYouClient) => {
  const { sharedSecret, identity } = useEncrtypedStorage();

  const fetchData = async () => {
    if (!sharedSecret) return false;

    return await hasValidToken(dotYouClient);
  };
  return useQuery({
    queryKey: ['verifyToken'],
    queryFn: fetchData,
    refetchOnMount: false,
    staleTime: MINUTE_IN_MS * 10,
    enabled: !!sharedSecret && !!identity,
  });
};

export default useVerifyToken;
