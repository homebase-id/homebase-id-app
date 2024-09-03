import { useQuery } from '@tanstack/react-query';

import { SystemFileType, TargetDrive } from '@homebase-id/js-lib/core';
import { getDecryptedThumbnailMeta } from '@homebase-id/js-lib/media';
import { useDotYouClientContext } from 'feed-app-common';
import { getDecryptedThumbnailMetaOverPeer } from '@homebase-id/js-lib/peer';

const useTinyThumb = ({
  odinId,
  imageFileId,
  imageFileKey,
  imageDrive,
}: {
  odinId?: string;
  imageFileId?: string;
  imageFileKey?: string;
  imageDrive?: TargetDrive;
}) => {
  const dotYouClient = useDotYouClientContext();
  const identity = dotYouClient.getIdentity();

  const fetchImageData = async (
    odinId: string,
    imageFileId?: string,
    imageGlobalTransitId?: string,
    imageFileKey?: string,
    imageDrive?: TargetDrive,
    systemFileType?: SystemFileType
  ) => {
    if (
      imageFileId === undefined ||
      imageFileId === '' ||
      imageFileKey === undefined ||
      imageFileKey === '' ||
      !imageDrive
    ) {
      return;
    }

    if (odinId !== identity) {
      return (
        (await getDecryptedThumbnailMetaOverPeer(
          dotYouClient,
          odinId,
          imageDrive,
          imageFileId,
          imageGlobalTransitId,
          imageFileKey,
          systemFileType
        )) || null
      );
    }

    return (
      (await getDecryptedThumbnailMeta(
        dotYouClient,
        imageDrive,
        imageFileId,
        imageFileKey,
        systemFileType
      )) || null
    );
  };

  return useQuery({
    queryKey: ['tinyThumb', odinId, imageFileId, imageDrive?.alias || ''],
    queryFn: () =>
      fetchImageData(odinId as string, imageFileId, imageFileKey as string, imageDrive),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60 * 1, // 1h
    enabled: !!imageFileId && imageFileId !== '' && !!odinId && !!imageFileKey,
  });
};

export default useTinyThumb;
