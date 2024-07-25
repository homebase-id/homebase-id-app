import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BlogConfig, PostContent } from '@youfoundation/js-lib/public';

import { ApiType, DotYouClient, HomebaseFile, deleteFile } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';

export const useManageSocialFeed = (props?: { odinId: string }) => {
  const odinId = props?.odinId;

  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const removeFromFeed = async ({ postFile }: { postFile: HomebaseFile<PostContent> }) => {
    return await deleteFile(
      dotYouClient,
      BlogConfig.FeedDrive,
      postFile.fileId,
      undefined,
      undefined,
      undefined,
      true
    );
  };

  const getContentReportUrl = () => {
    const host = new DotYouClient({ identity: odinId, api: ApiType.Guest }).getRoot();

    // Fetch the reporting url from the other identities config
    return fetch(`${host}/config/reporting`)
      .then((res) => {
        return res.json();
      })
      .then((data: { url: string }) => {
        return data.url;
      })
      .catch(() => {
        return `https://ravenhosting.cloud/report`;
      });
  };

  return {
    removeFromFeed: useMutation({
      mutationFn: removeFromFeed,
      onMutate: async () => {
        //
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['social-feeds'] });
      },
    }),
    getReportContentUrl: getContentReportUrl,
  };
};
