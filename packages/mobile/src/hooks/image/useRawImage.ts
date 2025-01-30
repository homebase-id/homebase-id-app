import { ImageSize, TargetDrive } from '@homebase-id/js-lib/core';
import { useQuery } from '@tanstack/react-query';
import { useDotYouClientContext } from 'homebase-id-app-common';
import { getDecryptedMediaUrlOverPeer } from '../../provider/image/RNExternalMediaProvider';
import { getDecryptedMediaUrl } from '@homebase-id/js-lib/media';
import { OdinBlob } from '../../../polyfills/OdinBlob';

export interface ImageData {
  url: string | OdinBlob | null;
  naturalSize?: ImageSize;
}

export const useRawImage = ({
  odinId,
  imageFileId,
  imageFileKey,
  imageDrive,
  size,
  probablyEncrypted,
  naturalSize,
  lastModified,
}: {
  odinId?: string;
  imageFileId?: string;
  imageFileKey?: string;
  imageDrive?: TargetDrive;
  size?: ImageSize;
  probablyEncrypted?: boolean;
  naturalSize?: ImageSize;
  lastModified?: number;
}) => {
  const dotYouClient = useDotYouClientContext();
  const localHost = dotYouClient.getLoggedInIdentity();
  const fetchImageData = async (
    odinId: string,
    imageFileId: string | undefined,
    imageFileKey: string | undefined,
    imageDrive?: TargetDrive,
    size?: ImageSize,
    probablyEncrypted?: boolean,
    naturalSize?: ImageSize
  ): Promise<ImageData | undefined> => {
    if (
      imageFileId === undefined ||
      imageFileId === '' ||
      !imageDrive ||
      imageFileKey === undefined ||
      imageFileKey === ''
    ) {
      return;
    }

    const fetchDataPromise = async () => {
      return {
        url:
          odinId !== localHost
            ? await getDecryptedMediaUrlOverPeer(
                dotYouClient,
                odinId,
                imageDrive,
                imageFileId,
                imageFileKey,
                probablyEncrypted,
                lastModified,
                { size }
              )
            : await getDecryptedMediaUrl(
                dotYouClient,
                imageDrive,
                imageFileId,
                imageFileKey,
                probablyEncrypted,
                lastModified,
                { size }
              ),
        naturalSize: naturalSize,
      };
    };

    return await fetchDataPromise();
  };

  return {
    fetch: useQuery({
      queryKey: [
        'raw-image',
        odinId || localHost,
        imageDrive?.alias,
        imageFileId,
        imageFileKey,
        `${size?.pixelHeight}x${size?.pixelWidth}`,
        lastModified,
      ],
      queryFn: () =>
        fetchImageData(
          odinId || localHost || '',
          imageFileId,
          imageFileKey,
          imageDrive,
          size,
          probablyEncrypted,
          naturalSize
        ),
      staleTime: 1000 * 60 * 60, // 1 hour
      enabled: !!imageFileId && imageFileId !== '' && !!imageFileKey && imageFileKey !== '',
    }),
  };
};
