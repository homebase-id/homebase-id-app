import { useQuery } from '@tanstack/react-query';
import { BlogConfig } from '@youfoundation/js-lib/public';
import { getDrivesByType } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';

export const useChannelDrives = (isEnabled: boolean) => {
  const dotYouClient = useDotYouClientContext();
  const fetchChannelData = async () => {
    return await (
      await getDrivesByType(dotYouClient, BlogConfig.DriveType, 1, 25)
    ).results;
  };

  return useQuery({
    queryKey: ['channel-drives'],
    queryFn: fetchChannelData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    enabled: isEnabled,
  });
};
