import { useQuery } from '@tanstack/react-query';

import {
  TargetDrive,
  DotYouClient,
  getDecryptedThumbnailMeta,
} from '@youfoundation/js-lib/core';
import { base64ToUint8Array } from '@youfoundation/js-lib/helpers';

const useTinyThumb = (
  dotYouClient: DotYouClient,
  odinId?: string,
  imageFileId?: string,
  imageDrive?: TargetDrive,
) => {
  const fetchImageData = async (
    odinId: string,
    imageFileId?: string,
    imageDrive?: TargetDrive,
  ) => {
    if (imageFileId === undefined || imageFileId === '' || !imageDrive) return;

    return (
      (await getDecryptedThumbnailMeta(
        dotYouClient,
        imageDrive,
        imageFileId,
      )) || null
    );
  };

  return useQuery(
    ['tinyThumb', odinId, imageFileId, imageDrive?.alias],
    () => fetchImageData(odinId as string, imageFileId, imageDrive),
    {
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10, // 10min
      cacheTime: Infinity,
      enabled: !!imageFileId && imageFileId !== '' && !!odinId,
      onError: error => {
        console.error(error);
      },
    },
  );
};

export default useTinyThumb;
