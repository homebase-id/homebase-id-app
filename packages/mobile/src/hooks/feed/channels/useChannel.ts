import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BlogConfig,
  getChannelDefinition,
  getChannelDefinitionBySlug,
} from '@homebase-id/js-lib/public';

import { ChannelDefinitionVm, parseChannelTemplate } from './useChannels';

import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import { getChannelOverPeer } from '@homebase-id/js-lib/peer';
import { useDotYouClientContext } from 'feed-app-common';

type useChannelsProps = {
  odinId?: string;
  channelKey?: string;
};

export const useChannel = ({ odinId, channelKey }: useChannelsProps) => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const fetchChannelData = async ({ channelKey }: useChannelsProps) => {
    if (!channelKey) return null;

    if (!odinId) {
      const cachedChannels = queryClient.getQueryData<HomebaseFile<ChannelDefinitionVm>[]>([
        'channels',
      ]);
      if (cachedChannels) {
        const foundChannel = cachedChannels.find(
          (chnl) =>
            stringGuidsEqual(chnl.fileMetadata.appData.uniqueId, channelKey) ||
            chnl.fileMetadata.appData.content.slug === channelKey
        );
        if (foundChannel) return foundChannel;
      }

      const directFetchOfChannel =
        (await getChannelDefinitionBySlug(dotYouClient, channelKey)) ||
        (await getChannelDefinition(dotYouClient, channelKey));

      if (directFetchOfChannel) {
        return {
          ...directFetchOfChannel,
          fileMetadata: {
            ...directFetchOfChannel.fileMetadata,
            appData: {
              ...directFetchOfChannel.fileMetadata.appData,
              content: {
                ...directFetchOfChannel.fileMetadata.appData.content,
                template: parseChannelTemplate(
                  directFetchOfChannel?.fileMetadata.appData.content?.templateId
                ),
              },
            },
          },
        } as HomebaseFile<ChannelDefinitionVm>;
      }
      return null;
    } else {
      // Optimization to not fetch similar content, might break if the public channel is adapted by the user... Perhaps we should always keep the slug?
      if (channelKey === BlogConfig.PublicChannelId) return BlogConfig.PublicChannelNewDsr;

      return (
        // (await getChannelBySlugOverPeer(dotYouClient, odinId, channelKey)) ||
        (await getChannelOverPeer(dotYouClient, odinId, channelKey)) || null
      );
    }
  };

  return {
    fetch: useQuery({
      queryKey: ['channel', odinId || dotYouClient.getIdentity(), channelKey],
      queryFn: () => fetchChannelData({ channelKey }),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      enabled: !!channelKey,
    }),
  };
};
