import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChannelDefinition,
  ChannelTemplate,
  getChannelDefinitions,
} from '@homebase-id/js-lib/public';

import { fetchCachedPublicChannels } from './cachedDataHelpers';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
export interface ChannelDefinitionVm extends ChannelDefinition {
  template: ChannelTemplate;
}

export const parseChannelTemplate = (templateId: number | undefined) => {
  return parseInt(templateId + '') === ChannelTemplate.LargeCards
    ? ChannelTemplate.LargeCards
    : parseInt(templateId + '') === ChannelTemplate.MasonryLayout
      ? ChannelTemplate.MasonryLayout
      : ChannelTemplate.ClassicBlog;
};

export const useChannels = ({
  isAuthenticated,
  isOwner,
}: {
  isAuthenticated: boolean;
  isOwner: boolean;
}) => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();
  const fetchChannelData = async () => {
    const fetchDynamicData = async () => {
      try {
        return (await getChannelDefinitions(dotYouClient))?.map((channel) => {
          return {
            ...channel,
            fileMetadata: {
              ...channel.fileMetadata,
              appData: {
                ...channel.fileMetadata.appData,
                content: {
                  ...channel.fileMetadata.appData.content,
                  template: parseChannelTemplate(
                    channel?.fileMetadata?.appData?.content?.templateId
                  ),
                },
              },
            },
          } as HomebaseFile<ChannelDefinitionVm>;
        });
      } catch (e) {
        ('failed to fetch dynamic data');
      }
    };

    const returnData = isOwner
      ? await fetchDynamicData()
      : ((await fetchCachedPublicChannels(dotYouClient)) ?? (await fetchDynamicData()));

    if (isAuthenticated && !isOwner) {
      // We are authenticated, so we might have more data when fetching non-static data; Let's do so async with timeout to allow other static info to load and render
      setTimeout(async () => {
        const dynamicData = await fetchDynamicData();
        if (dynamicData) {
          queryClient.setQueryData(['channels'], dynamicData);
        }
      }, 500);
    }

    return returnData;
  };

  return useQuery({
    queryKey: ['channels'],
    queryFn: fetchChannelData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
};
