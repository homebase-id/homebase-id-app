import { useQuery } from '@tanstack/react-query';

import { TargetDrive } from '@youfoundation/js-lib/core';
import { getDecryptedThumbnailMeta } from '@youfoundation/js-lib/media';
import { useDotYouClientContext } from 'feed-app-common';

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
  const fetchImageData = async (
    odinId: string,
    imageFileId?: string,
    imageFileKey?: string,
    imageDrive?: TargetDrive
  ) => {
    if (imageFileId === undefined || imageFileId === '' || !imageDrive || !imageFileKey) {
      return null;
    }
    return (
      (await getDecryptedThumbnailMeta(
        dotYouClient,
        imageDrive,
        imageFileId,
        imageFileKey,
        'Standard'
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
