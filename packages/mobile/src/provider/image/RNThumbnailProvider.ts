import {
  ImageContentType,
  ImageSize,
  ThumbnailFile,
  EmbeddedThumb,
} from '@homebase-id/js-lib/core';
import { ThumbnailInstruction } from '@homebase-id/js-lib/media';
import { base64ToUint8Array, getNewId, uint8ArrayToBase64 } from '@homebase-id/js-lib/helpers';
import { Platform } from 'react-native';
import { CachesDirectoryPath, copyFile, readFile, stat, unlink } from 'react-native-fs';
import ImageResizer, { ResizeFormat } from '@bam.tech/react-native-image-resizer';
import { ImageSource } from './RNImageProvider';
import { OdinBlob } from '../../../polyfills/OdinBlob';

export const baseThumbSizes: ThumbnailInstruction[] = [
  { quality: 75, width: 250, height: 250 },
  { quality: 75, width: 600, height: 600 },
  { quality: 75, width: 1600, height: 1600 },
];

const tinyThumbSize: ThumbnailInstruction = {
  quality: 10,
  width: 20,
  height: 20,
};

const svgType = 'image/svg+xml';
const gifType = 'image/gif';

const getEmbeddedThumbOfThumbnailFile = async (
  thumbnailFile: ThumbnailFile,
  naturalSize: ImageSize
): Promise<EmbeddedThumb> => {
  return {
    pixelWidth: naturalSize.pixelWidth, // on the previewThumb we use the full pixelWidth & -height so the max size can be used
    pixelHeight: naturalSize.pixelHeight, // on the previewThumb we use the full pixelWidth & -height so the max size can be used
    contentType: thumbnailFile.payload.type as ImageContentType,
    content: uint8ArrayToBase64(new Uint8Array(await thumbnailFile.payload.arrayBuffer())),
  };
};

export const createThumbnails = async (
  photo: ImageSource,
  key: string,
  contentType?: ImageContentType,
  thumbSizes?: ThumbnailInstruction[]
): Promise<{
  naturalSize: ImageSize;
  tinyThumb: EmbeddedThumb;
  additionalThumbnails: ThumbnailFile[];
}> => {
  if (!photo.filepath && !photo.uri) throw new Error('No filepath found in image source');

  // We take a copy of the file, as it can be a virtual file that is not accessible by the native code; Eg: ImageResizer
  const copyOfSourcePath = `file://${CachesDirectoryPath}/${getNewId()}.${photo.type?.split('/')[1]}`;
  await copyFile((photo.filepath || photo.uri) as string, copyOfSourcePath);

  const fileStats = await stat(copyOfSourcePath);
  if (fileStats.size < 1) {
    await unlink(copyOfSourcePath);
    throw new Error('No image data found');
  }

  const adaptedPhoto = { ...photo, filepath: copyOfSourcePath, uri: copyOfSourcePath };

  const result = innerCreateThumbnails(adaptedPhoto, key, contentType, thumbSizes);
  return result;
};

const innerCreateThumbnails = async (
  photo: ImageSource,
  key: string,
  contentType?: ImageContentType,
  thumbSizes?: ThumbnailInstruction[]
): Promise<{
  naturalSize: ImageSize;
  tinyThumb: EmbeddedThumb;
  additionalThumbnails: ThumbnailFile[];
}> => {
  if (contentType === svgType) {
    const vectorThumb = await createVectorThumbnail(photo.filepath || (photo.uri as string), key);

    return {
      tinyThumb: await getEmbeddedThumbOfThumbnailFile(vectorThumb.thumb, vectorThumb.naturalSize),
      naturalSize: vectorThumb.naturalSize,
      additionalThumbnails: [],
    };
  }

  if (contentType === gifType) {
    const gifThumb = await createImageThumbnail(photo, key, {
      ...tinyThumbSize,
      type: 'gif',
    });

    return {
      tinyThumb: await getEmbeddedThumbOfThumbnailFile(gifThumb.thumb, gifThumb.naturalSize),
      naturalSize: gifThumb.naturalSize,
      additionalThumbnails: [],
    };
  }

  // Create a thumbnail that fits scaled into a 20 x 20 canvas
  const { naturalSize, thumb: tinyThumb } = await createImageThumbnail(photo, key, tinyThumbSize);

  const applicableThumbSizes = (thumbSizes || baseThumbSizes).reduce((currArray, thumbSize) => {
    if (tinyThumb.payload.type === svgType) return currArray;

    if (naturalSize.pixelWidth < thumbSize.width && naturalSize.pixelHeight < thumbSize.height) {
      return currArray;
    }

    return [...currArray, thumbSize];
  }, [] as ThumbnailInstruction[]);

  if (
    applicableThumbSizes.length !== (thumbSizes || baseThumbSizes).length &&
    !applicableThumbSizes.some((thumbSize) => thumbSize.width === naturalSize.pixelWidth)
  ) {
    // Source image is too small for some of the requested sizes so we add the source dimensions as exact size
    applicableThumbSizes.push({
      quality: 100,
      width: naturalSize.pixelWidth,
      height: naturalSize.pixelHeight,
    });
  }

  // Create additionalThumbnails
  const additionalThumbnails: ThumbnailFile[] = [
    tinyThumb,
    ...(await Promise.all(
      applicableThumbSizes.map(
        async (thumbSize) => await (await createImageThumbnail(photo, key, thumbSize)).thumb
      )
    )),
  ];

  return {
    naturalSize,
    tinyThumb: await getEmbeddedThumbOfThumbnailFile(tinyThumb, naturalSize),
    additionalThumbnails,
  };
};

const createVectorThumbnail = async (
  imageFilePath: string,
  key: string
): Promise<{ naturalSize: ImageSize; thumb: ThumbnailFile }> => {
  const imageBytes = base64ToUint8Array(await readFile(imageFilePath, 'base64'));

  return {
    naturalSize: {
      pixelWidth: 50,
      pixelHeight: 50,
    },
    thumb: {
      pixelWidth: 50,
      pixelHeight: 50,
      payload: new OdinBlob([imageBytes], { type: svgType }) as unknown as Blob,
      key,
    },
  };
};

const createImageThumbnail = async (
  photo: ImageSource,
  key: string,
  instruction: ThumbnailInstruction,
  format: 'webp' | 'png' | 'jpeg' = Platform.OS === 'android' ? 'webp' : 'jpeg'
): Promise<{ naturalSize: ImageSize; thumb: ThumbnailFile }> => {
  if (!photo.filepath && !photo.uri) throw new Error('No filepath found in image source');

  return createResizedImage(photo, instruction, format).then(async (resizedData) => {
    return {
      naturalSize: rotateNaturalSize(photo, resizedData),
      thumb: {
        pixelWidth: resizedData.width,
        pixelHeight: resizedData.height,
        payload: new OdinBlob(resizedData.path, {
          type: `image/${instruction.type || format}`,
        }) as unknown as Blob,
        key,
      },
    };
  });
};

const rotateNaturalSize = (
  natural: { width: number; height: number },
  resized: { width: number; height: number }
) => {
  const naturalAspectRatio = natural.width / natural.height;
  const resizedAspectRatio = resized.width / resized.height;

  // If the aspect ratios are equal, no 90° or 270° rotation
  // Error margin of 0.25 to account for rounding errors as the resized version is smaller so the aspect ratio is less precise
  if (Math.abs(naturalAspectRatio - resizedAspectRatio) < 0.25) {
    return {
      pixelWidth: natural.width,
      pixelHeight: natural.height,
    };
  }

  // If the aspect ratio is inverted (flipped), we assume 90° or 270° rotation
  else {
    return {
      pixelWidth: natural.height,
      pixelHeight: natural.width,
    };
  }
};

export const createResizedImage = async (
  photo: ImageSource,
  instruction: ThumbnailInstruction,
  format: 'webp' | 'png' | 'jpeg' = Platform.OS === 'android' ? 'webp' : 'jpeg'
) => {
  return await ImageResizer.createResizedImage(
    (photo.filepath || photo.uri) as string,
    instruction.width,
    instruction.height,
    format.toUpperCase() as ResizeFormat,
    instruction.quality,
    undefined,
    undefined
  );
};
