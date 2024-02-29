import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  ImageSize,
  TargetDrive,
  ImageContentType,
} from '@youfoundation/js-lib/core';
import { removeImage } from '@youfoundation/js-lib/media';
import { useDotYouClientContext } from 'feed-app-common';
import RNFS from 'react-native-fs';
import { getDecryptedImageData } from '../../../../provider/image/RNImageProvider';
import { useAuth } from '../../../../hooks/auth/useAuth';

interface ImageData {
  url: string;
  naturalSize?: ImageSize;
  type?: ImageContentType;
}

const useImage = (
  odinId?: string,
  imageFileId?: string | undefined,
  imageFileKey?: string | undefined,
  imageDrive?: TargetDrive,
  size?: ImageSize,
  probablyEncrypted?: boolean,
  naturalSize?: ImageSize,
) => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();
  const { authToken } = useAuth();

  const checkIfWeHaveLargerCachedImage = (
    odinId: string | undefined,
    imageFileId: string,
    imageFileKey: string,
    imageDrive: TargetDrive,
    size?: ImageSize,
  ) => {
    const cachedEntries = queryClient
      .getQueryCache()
      .findAll({
        queryKey: [
          'image',
          odinId,
          imageDrive?.alias,
          imageFileId,
          imageFileKey,
        ],
        exact: false,
      })
      .filter(query => query.state.status !== 'error');

    const cachedEntriesWithSize = cachedEntries.map(entry => {
      const sizeParts = (entry.queryKey[5] as string)?.split('x');
      const size = sizeParts
        ? {
            pixelHeight: parseInt(sizeParts[0]),
            pixelWidth: parseInt(sizeParts[1]),
          }
        : undefined;

      return {
        ...entry,
        size,
      };
    });

    if (!size) return cachedEntriesWithSize.find(entry => !entry.size);

    return cachedEntriesWithSize
      .filter(entry => !!entry.size)
      .find(entry => {
        if (
          entry.size &&
          entry.size.pixelHeight >= size.pixelHeight &&
          entry.size.pixelWidth >= size.pixelWidth
        ) {
          return true;
        }
      });
  };

  const fetchImageData = async (
    odinId: string | undefined,
    imageFileId: string | undefined,
    imageFileKey: string | undefined,
    imageDrive?: TargetDrive,
    size?: ImageSize,
    probablyEncrypted?: boolean,
    naturalSize?: ImageSize,
  ): Promise<ImageData | undefined> => {
    if (
      imageFileId === undefined ||
      imageFileId === '' ||
      !imageDrive ||
      !imageFileKey ||
      !authToken
    ) {
      return;
    }

    const cachedEntry = checkIfWeHaveLargerCachedImage(
      odinId,
      imageFileId,
      imageFileKey,
      imageDrive,
      size,
    );
    if (cachedEntry) {
      const cachedData = queryClient.getQueryData<ImageData | undefined>(
        cachedEntry.queryKey,
      );
      if (cachedData && (await RNFS.exists(cachedData.url))) return cachedData;
    }

    const imageBlob = await getDecryptedImageData(
      dotYouClient,
      imageDrive,
      imageFileId,
      imageFileKey,
      authToken,
      size,
    );

    if (!imageBlob) return undefined;

    return {
      url: imageBlob.uri,
      naturalSize: naturalSize,
      type: imageBlob.type as ImageContentType,
    };
  };

  const removeImageFile = async ({
    targetDrive,
    fileId,
  }: {
    targetDrive: TargetDrive;
    fileId: string;
  }) => {
    return await removeImage(dotYouClient, fileId, targetDrive);
  };

  return {
    fetch: useQuery({
      queryKey: [
        'image',
        odinId,
        imageDrive?.alias,
        imageFileId,
        imageFileKey,
        // Rounding the cache key of the size so close enough sizes will be cached together
        size
          ? `${Math.round(size.pixelHeight / 25) * 25}x${
              Math.round(size?.pixelWidth / 25) * 25
            }`
          : undefined,
      ],
      queryFn: () =>
        fetchImageData(
          odinId,
          imageFileId,
          imageFileKey,
          imageDrive,
          size,
          probablyEncrypted,
          naturalSize,
        ),
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 min
      gcTime: 1000 * 60 * 60 * 24, // 24h
      enabled: !!imageFileId && imageFileId !== '' && !!imageFileKey,
    }),
    getFromCache: (
      odinId: string | undefined,
      imageFileId: string,
      imageDrive: TargetDrive,
    ) => {
      const cachedEntries = queryClient
        .getQueryCache()
        .findAll({
          queryKey: [
            'image',
            odinId,
            imageDrive?.alias,
            imageFileId,
            imageFileKey,
          ],
          exact: false,
        })
        .filter(query => query.state.status === 'success');

      if (cachedEntries?.length) {
        return queryClient.getQueryData<ImageData | undefined>(
          cachedEntries[0].queryKey,
        );
      }
    },
    remove: useMutation({ mutationFn: removeImageFile }),
  };
};

export default useImage;
