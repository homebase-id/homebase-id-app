import { useQuery } from '@tanstack/react-query';

import {
  TargetDrive,
  DotYouClient,
  getDecryptedThumbnailMeta,
} from '@youfoundation/js-lib/core';
import { base64ToUint8Array } from '@youfoundation/js-lib/helpers';
import { GetFileEntryFromCache } from '@youfoundation/js-lib/public';

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

    // Look for tiny thumb in already fetched data:
    const thumbFromStaticFile = await GetFileEntryFromCache(imageFileId);
    if (
      thumbFromStaticFile?.[0]?.header.fileMetadata.appData.previewThumbnail
    ) {
      const previewThumbnail =
        thumbFromStaticFile[0].header.fileMetadata.appData.previewThumbnail;
      const buffer = base64ToUint8Array(previewThumbnail.content);
      const url = URL.createObjectURL(new Blob([buffer as any]));

      return {
        naturalSize: {
          width: previewThumbnail.pixelWidth,
          height: previewThumbnail.pixelHeight,
        },
        sizes:
          thumbFromStaticFile[0].header.fileMetadata.appData
            .additionalThumbnails ?? [],
        url,
      };
    }

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
