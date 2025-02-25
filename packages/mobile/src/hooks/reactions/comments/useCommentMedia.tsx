import { useQuery } from '@tanstack/react-query';
import { TargetDrive } from '@homebase-id/js-lib/core';
import { getDecryptedImageUrl } from '@homebase-id/js-lib/media';
import { getDecryptedImageUrlOverPeer } from '@homebase-id/js-lib/peer';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { addLogs } from '../../../provider/log/logger';
import { generateClientError } from '../../errors/useErrors';

export const useCommentMedia = ({
  odinId,
  targetDrive,
  fileId,
  fileKey,
}: {
  odinId: string | undefined;
  targetDrive: TargetDrive | undefined;
  fileId: string | undefined;
  fileKey: string | undefined;
}) => {
  const dotYouClient = useDotYouClientContext();

  const fetch = async ({
    odinId,
    targetDrive,
    fileId,
    fileKey,
  }: {
    odinId: string | undefined;
    targetDrive: TargetDrive | undefined;
    fileId: string | undefined;
    fileKey: string | undefined;
  }) => {
    if (!odinId || !targetDrive || !fileId || !fileKey) return null;

    const isLocal = odinId === dotYouClient.getLoggedInIdentity();

    return isLocal
      ? getDecryptedImageUrl(dotYouClient, targetDrive, fileId, fileKey, undefined, undefined, {
          size: {
            pixelWidth: 250,
            pixelHeight: 250,
          },
          systemFileType: 'Comment',
        })
      : getDecryptedImageUrlOverPeer(
          dotYouClient,
          odinId,
          targetDrive,
          fileId,
          fileKey,
          undefined,
          undefined,
          {
            size: {
              pixelWidth: 250,
              pixelHeight: 250,
            },
            systemFileType: 'Comment',
          }
        );
  };

  return {
    fetch: useQuery({
      queryKey: ['comment-media', odinId, targetDrive?.alias, fileId],
      queryFn: () => fetch({ odinId, targetDrive, fileId, fileKey }),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      enabled: !!odinId && !!targetDrive && !!fileId,
      throwOnError: (error, _) => {
        const newError = generateClientError(error, t('Failed to get the comment media'));
        addLogs(newError);
        return false;
      },
    }),
  };
};
