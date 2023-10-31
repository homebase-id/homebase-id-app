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

  return useQuery({
    queryKey: ['tinyThumb', odinId, imageFileId, imageDrive?.alias],
    queryFn: () => fetchImageData(odinId as string, imageFileId, imageDrive),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10, // 10min
    gcTime: Infinity,
    enabled: !!imageFileId && imageFileId !== '' && !!odinId,
  });
};

export default useTinyThumb;
