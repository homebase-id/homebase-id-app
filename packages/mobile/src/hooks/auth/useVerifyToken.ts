import { useQuery } from '@tanstack/react-query';
import { hasValidToken } from '@homebase-id/js-lib/auth';
import { useEncrtypedStorage } from './useEncryptedStorage';
import { DotYouClient } from '@homebase-id/js-lib/core';
import { useNetInfo } from '@react-native-community/netinfo';

const MINUTE_IN_MS = 60000;

const useVerifyToken = (dotYouClient: DotYouClient) => {
  const { sharedSecret, identity } = useEncrtypedStorage();
  const netinfo = useNetInfo();

  const fetchData = async () => {
    if (!sharedSecret) return false;
    if (netinfo.isConnected === false) return true;

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
