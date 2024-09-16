import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ImageSize, TargetDrive, ImageContentType, SystemFileType } from '@homebase-id/js-lib/core';
import { exists } from 'react-native-fs';
import { useAuth } from '../../../../hooks/auth/useAuth';
import { getDecryptedImageData } from '../../../../provider/image/RNImageProvider';

import { useDotYouClientContext } from 'feed-app-common';
import {
  getDecryptedMediaDataOverPeerByGlobalTransitId,
  getDecryptedMediaUrlOverPeer,
} from '../../../../provider/image/RNExternalMediaProvider';

interface ImageData {
  url: string;
  naturalSize?: ImageSize;
  type?: ImageContentType;
}

const useImage = (props?: {
  odinId?: string;
  imageFileId?: string | undefined;
  imageFileKey?: string | undefined;
  imageGlobalTransitId?: string | undefined;
  imageDrive?: TargetDrive;
  probablyEncrypted?: boolean;
  systemFileType?: SystemFileType;
  size?: ImageSize;
  naturalSize?: ImageSize;
  lastModified?: number;
}) => {
  const {
    odinId,
    imageFileId,
    imageFileKey,
    imageDrive,
    size,
    naturalSize,
    lastModified,
    imageGlobalTransitId,
    probablyEncrypted,
    systemFileType,
  } = props || {};
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const localHost = dotYouClient.getIdentity(); // This is the identity of the user

  function queryKeyBuilder(
    odinId: string | undefined,
    imageFileId: string | undefined,
    imageFileKey: string | undefined,
    imageDrive: TargetDrive | undefined,
    size?: ImageSize,
    lastModified?: number
  ) {
    const queryKey = [
      'image',
      odinId || '',
      imageDrive?.alias,
      imageFileId?.replaceAll('-', ''),
      imageFileKey,
    ];

    if (size) {
      queryKey.push(
        `${Math.round(size.pixelHeight / 25) * 25}x${Math.round(size?.pixelWidth / 25) * 25}`
      );
    }

    if (lastModified) {
      queryKey.push(lastModified + '');
    }

    return queryKey;
  }

  const getCachedImages = (
    odinId: string | undefined,
    imageFileId: string,
    imageFileKey: string,
    imageDrive: TargetDrive
  ) => {
    const cachedEntries = queryClient
      .getQueryCache()
      .findAll({
        queryKey: queryKeyBuilder(odinId, imageFileId, imageFileKey, imageDrive),
        exact: false,
      })
      .filter((query) => query.state.status !== 'error');

    const cachedEntriesWithSize = cachedEntries.map((entry) => {
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

    return cachedEntriesWithSize;
  };

  const checkIfWeHaveLargerCachedImage = (
    odinId: string | undefined,
    imageFileId: string,
    imageFileKey: string,
    imageDrive: TargetDrive,
    size?: ImageSize
  ) => {
    const cachedEntriesWithSize = getCachedImages(odinId, imageFileId, imageFileKey, imageDrive);
    if (!size) return cachedEntriesWithSize.find((entry) => !entry.size);

    const cachedEntry = cachedEntriesWithSize
      .filter((entry) => !!entry.size)
      .find((entry) => {
        if (
          entry.size &&
          (entry.size.pixelHeight >= size.pixelHeight || entry.size.pixelWidth >= size.pixelWidth)
        ) {
          return true;
        }
      });

    if (cachedEntry) return cachedEntry;

    return null;
  };

  const fetchImageData = async (
    odinId: string | undefined,
    imageFileId: string | undefined,
    imageFileKey: string | undefined,
    imageGlobalTransitId: string | undefined,
    imageDrive?: TargetDrive,
    size?: ImageSize,
    naturalSize?: ImageSize,
    lastModified?: number,
    systemFileType?: SystemFileType
  ): Promise<ImageData | null> => {
    if (imageFileId === undefined || imageFileId === '' || !imageDrive || !imageFileKey) {
      return null;
    }
    const key = queryKeyBuilder(odinId, imageFileId, imageFileKey, imageDrive, size, lastModified);

    const fetchImageFromServer = async (): Promise<ImageData | null> => {
      if (odinId && odinId !== localHost) {
        if (imageGlobalTransitId) {
          const imageBlob = await getDecryptedMediaDataOverPeerByGlobalTransitId(
            dotYouClient,
            odinId,
            imageDrive,
            imageGlobalTransitId,
            imageFileKey,
            probablyEncrypted,
            lastModified,
            {
              size,
            }
          );
          if (!imageBlob) return null;

          // check if imageBLob is string return string, else if odinBlob, return uri
          if (typeof imageBlob === 'string') {
            return {
              url: imageBlob,
              naturalSize: naturalSize,
              type: 'image/jpeg',
            };
          } else {
            return {
              url: imageBlob.uri,
              naturalSize: naturalSize,
              type: imageBlob.type as ImageContentType,
            };
          }
        } else {
          const imageBlob = await getDecryptedMediaUrlOverPeer(
            dotYouClient,
            odinId,
            imageDrive,
            imageFileId,
            imageFileKey,
            probablyEncrypted,
            lastModified,
            {
              size,
            }
          );
          if (!imageBlob) return null;
          if (typeof imageBlob === 'string') {
            return {
              url: imageBlob,
              naturalSize: naturalSize,
              type: 'image/jpeg',
            };
          } else {
            return {
              url: imageBlob.uri,
              naturalSize: naturalSize,
              type: imageBlob.type as ImageContentType,
            };
          }
        }
      }

      const imageBlob = await getDecryptedImageData(
        dotYouClient,
        imageDrive,
        imageFileId,
        imageFileKey,
        size,
        systemFileType,
        lastModified
      );

      if (!imageBlob) return null;

      return {
        url: imageBlob.uri,
        naturalSize: naturalSize,
        type: imageBlob.type as ImageContentType,
      };
    };

    // Find any cached version, the bigger the better and if we have it return it;
    const cachedImages = getCachedImages(odinId, imageFileId, imageFileKey, imageDrive);
    if (cachedImages.length) {
      const largestCachedImage = cachedImages.reduce((prev, current) => {
        if (!prev) return current;

        // No size is bigger than any size
        if (!prev.size) return prev;
        if (!current.size) return current;

        if (
          prev.size.pixelHeight * prev.size.pixelWidth >
          current.size.pixelHeight * current.size.pixelWidth
        ) {
          return prev;
        }
        return current;
      });

      const cachedData = queryClient.getQueryData<ImageData | undefined>(
        largestCachedImage.queryKey
      );
      if (cachedData && (await exists(cachedData.url))) {
        // If the cached version is smaller than what we need, we'll fetch the new one and update the cache for the requested size
        if (
          // If the largestCachedImage has no size, it's the largest possible size
          largestCachedImage.size &&
          // If the requested size is bigger than the cached size
          size &&
          size.pixelHeight > largestCachedImage.size.pixelHeight
        ) {
          setTimeout(async () => {
            //const imageBlob =
            // TODO Fetch the right image
            const imageData = await fetchImageFromServer();
            if (!imageData) return;

            console.log('Fetched a bigger image and updating cache', key);
            queryClient.setQueryData<ImageData | undefined>(
              queryKeyBuilder(odinId, imageFileId, imageFileKey, imageDrive, size, lastModified),
              imageData
            );
          }, 0);
        }

        return cachedData;
      }
    }

    console.log('Fetching image from server', key);
    return fetchImageFromServer();
  };

  return {
    fetch: useQuery({
      queryKey: queryKeyBuilder(odinId, imageFileId, imageFileKey, imageDrive, size, lastModified),
      queryFn: () =>
        fetchImageData(
          odinId,
          imageFileId,
          imageFileKey,
          imageGlobalTransitId,
          imageDrive,
          size,
          naturalSize,
          lastModified,
          systemFileType
        ),
      // Stale time is 0, to always trigger a fetch,
      //   while the fetch checks if we have anything in cache from before and confirms it on disk
      staleTime: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      enabled: !!imageFileId && imageFileId !== '',
    }),
    getFromCache: (
      odinId: string | undefined,
      imageFileId: string,
      imageFileKey: string,
      imageDrive: TargetDrive,
      imageGlobalTransitId?: string | undefined,
      size?: ImageSize
    ) => {
      const largerCache = checkIfWeHaveLargerCachedImage(
        odinId,
        imageFileId,
        imageFileKey,
        imageDrive,
        size
      );

      if (largerCache) {
        return {
          size: largerCache?.size,
          imageData: queryClient.getQueryData<ImageData | undefined>(largerCache?.queryKey),
        };
      }

      const cachedEntries = queryClient
        .getQueryCache()
        .findAll({
          queryKey: queryKeyBuilder(
            odinId,
            imageGlobalTransitId || imageFileId,
            imageFileKey,
            imageDrive
          ),
          exact: false,
        })
        .filter((query) => query.state.status === 'success');

      if (cachedEntries?.length) {
        return {
          size: undefined,
          imageData: queryClient.getQueryData<ImageData | undefined>(cachedEntries[0].queryKey),
        };
      }
    },
    invalidateCache: (
      odinId: string | undefined,
      imageFileId: string | undefined,
      imageFileKey: string | undefined,
      imageDrive: TargetDrive,
      size?: ImageSize
    ) => {
      if (imageFileId === undefined || imageFileId === '' || !imageDrive || !imageFileKey) {
        return null;
      }
      const queryKey = queryKeyBuilder(
        odinId,
        imageGlobalTransitId || imageFileId,
        imageFileKey,
        imageDrive,
        size
      );
      queryClient.invalidateQueries({ queryKey, exact: true });
    },
  };
};

export default useImage;
