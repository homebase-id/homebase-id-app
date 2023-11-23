import { useQuery } from '@tanstack/react-query';

import {
  TargetDrive,
  DotYouClient,
  getDecryptedThumbnailMeta,
} from '@youfoundation/js-lib/core';

const useTinyThumb = (
  dotYouClient: DotYouClient,
  odinId?: string,
  imageFileId?: string,
  imageFileKey?: string,
  imageDrive?: TargetDrive,
) => {
  const fetchImageData = async (
    odinId: string,
    imageFileId?: string,
    imageFileKey?: string,
    imageDrive?: TargetDrive,
  ) => {
    if (imageFileId === undefined || imageFileId === '' || !imageDrive || !imageFileKey) return;

    return (
      (await getDecryptedThumbnailMeta(
        dotYouClient,
        imageDrive,
        imageFileId,
        imageFileKey,
        'Standard',
      )) || null
    );
  };

  return useQuery({
    queryKey: ['tinyThumb', odinId, imageFileId, imageDrive?.alias],
    queryFn: () => fetchImageData(odinId as string, imageFileId, imageFileKey as string, imageDrive),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10, // 10min
    gcTime: Infinity,
    enabled: !!imageFileId && imageFileId !== '' && !!odinId && !!imageFileKey,
  });
};

export default useTinyThumb;
