
import {
  ImageContentType,
  ImageSize,
  ThumbnailFile,
  EmbeddedThumb,
} from '@homebase-id/js-lib/core';
import { base64ToUint8Array, getNewId, uint8ArrayToBase64 } from '@homebase-id/js-lib/helpers';
import { Platform } from 'react-native';
import { CachesDirectoryPath, copyFile, readFile, stat, unlink } from 'react-native-fs';
import ImageResizer, { ResizeFormat } from '@bam.tech/react-native-image-resizer';
import { ImageSource } from './RNImageProvider';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { isBase64ImageURI, getExtensionForMimeType } from '../../utils/utils';
import { ThumbnailInstruction } from '@homebase-id/js-lib/media';

export const baseThumbSizes: ThumbnailInstruction[] = [
  { quality: 84, maxPixelDimension: 320, maxBytes: 26 * 1024 },
  { quality: 84, maxPixelDimension: 640, maxBytes: 102 * 1024 },
  { quality: 76, maxPixelDimension: 1080, maxBytes: 291 * 1024 },
  { quality: 76, maxPixelDimension: 1600, maxBytes: 640 * 1024 },
];

export const tinyThumbSize: ThumbnailInstruction = {
  quality: 76,
  maxPixelDimension: 20,
  maxBytes: 768,
};

const svgType = 'image/svg+xml';
const gifType = 'image/gif';


// Adapted from browser code
export const getRevisedThumbs = (
  sourceSize: ImageSize,
  thumbs: ThumbnailInstruction[]
): ThumbnailInstruction[] => {
  const sourceMax = Math.max(sourceSize.pixelWidth, sourceSize.pixelHeight);
  const thresholdMin = Math.floor((90 * sourceMax) / 100);
  const thresholdMax = Math.floor((110 * sourceMax) / 100);

  // Filter thumbnails: keep those not larger than sourceMax and outside 10% range
  const keptThumbs = thumbs.filter(
    (t) =>
      (t.maxPixelDimension ?? 0) <= sourceMax &&
      ((t.maxPixelDimension ?? 0) < thresholdMin ||
        (t.maxPixelDimension ?? 0) > thresholdMax)
  );

  // If any thumbnails were removed, add the source size as a thumbnail
  if (keptThumbs.length < thumbs.length) {
    // Find the thumbnail with closest maxPixelDimension
    const nearestThumb = thumbs
      .slice()
      .sort(
        (a, b) =>
          Math.abs((a.maxPixelDimension ?? 0) - sourceMax) -
          Math.abs((b.maxPixelDimension ?? 0) - sourceMax)
      )[0];

    let maxBytes: number;
    if (
      nearestThumb &&
      nearestThumb.maxPixelDimension &&
      nearestThumb.maxBytes
    ) {
      const scale = sourceMax / nearestThumb.maxPixelDimension;
      maxBytes = Math.round(nearestThumb.maxBytes * scale);
      // Clamp between 10KB and 1MB
      maxBytes = Math.max(10 * 1024, Math.min(maxBytes, 1024 * 1024));
    } else {
      maxBytes = 300 * 1024;
    }

    keptThumbs.push({
      quality: sourceMax <= 640 ? 84 : 76,
      maxPixelDimension: sourceMax,
      maxBytes,
    });
  }

  return keptThumbs.sort(
    (a, b) => (a.maxPixelDimension ?? 0) - (b.maxPixelDimension ?? 0)
  );
};

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
  let copyOfSourcePath = photo.filepath || (photo.uri as string);

  if (!isBase64ImageURI(copyOfSourcePath)) {
    // We take a copy of the file, as it can be a virtual file that is not accessible by the native code; Eg: ImageResizer
    copyOfSourcePath = `file://${CachesDirectoryPath}/${getNewId()}.${getExtensionForMimeType(photo.type)}`;
    await copyFile((photo.filepath || photo.uri) as string, copyOfSourcePath);

    const fileStats = await stat(copyOfSourcePath);
    if (fileStats.size < 1) {
      await unlink(copyOfSourcePath);
      throw new Error('No image data found');
    }
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


  // Use getRevisedThumbs for thumbnail selection
  const applicableThumbSizes: ThumbnailInstruction[] = getRevisedThumbs(naturalSize, thumbSizes || baseThumbSizes);


  // Avoid duplicate tinyThumb if its size matches natural size
  const thumbFiles: ThumbnailFile[] = [];
  if (tinyThumb.pixelWidth !== naturalSize.pixelWidth || tinyThumb.pixelHeight !== naturalSize.pixelHeight) {
    thumbFiles.push(tinyThumb);
  }

  // Add revised thumbs
  thumbFiles.push(
    ...(
      await Promise.all(
        applicableThumbSizes.map(
          async (thumbSize) => (await createImageThumbnail(photo, key, thumbSize)).thumb
        )
      )
    )
  );

  const additionalThumbnails: ThumbnailFile[] = thumbFiles;

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

  // Use maxPixelDimension for both width and height (ensure numbers)
  let targetWidth = Math.max(1, instruction.maxPixelDimension || 1);
  let targetHeight = Math.max(1, instruction.maxPixelDimension || 1);

  // Byte-budget compression loop
  const maxBytes = instruction.maxBytes ?? Number.POSITIVE_INFINITY;
  const isTinyThumb = targetWidth <= tinyThumbSize.maxPixelDimension;

  // FIX 1: Apply platform-specific quality adjustment from the start
  let quality = instruction.quality;
  let sourcePath: string = (photo.filepath || photo.uri) as string;

  // First resize attempt
  let resizedData = await createResizedImage(
    { ...photo, filepath: sourcePath, uri: sourcePath },
    { ...instruction, width: targetWidth, height: targetHeight, quality },
    format
  );
  let fileStats = await stat(resizedData.path);

  // Reduce quality until size <= maxBytes or quality reaches 1
  while (fileStats.size > maxBytes && quality > 1) {
    const excessRatio = fileStats.size / maxBytes;
    const qualityDrop = Math.min(40, Math.max(5, Math.floor(quality * excessRatio * 0.5)));
    quality = Math.max(1, quality - qualityDrop);

    // For tiny thumbs, progressively recompress from the last resized output.
    // For larger thumbs, recompress from the original to avoid compounding artifacts.
    sourcePath = isTinyThumb ? resizedData.path : ((photo.filepath || photo.uri) as string);

    resizedData = await createResizedImage(
      { ...photo, filepath: sourcePath, uri: sourcePath },
      { ...instruction, width: targetWidth, height: targetHeight, quality },
      format
    );
    fileStats = await stat(resizedData.path);

    // If still too large at quality ~1 for tiny thumbs, shrink dimensions
    if (fileStats.size > maxBytes && quality < 2 && isTinyThumb) {
      if (targetWidth === 1) {
        throw new Error(
          'The world has ended. A 1x1 thumb in quality 1 takes up more than MaxBytes bytes...'
        );
      }

      // Use the current resized output as next input and try smaller dimensions
      sourcePath = resizedData.path;
      quality = 2; // ensure loop runs again
      targetWidth = Math.max(1, targetWidth - 5);
      targetHeight = Math.max(1, targetHeight - 5);
    }
  }

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

const getQualityForPlatform = (quality: number): number => {
  if (Platform.OS === 'ios') {
    // iOS encoder is more conservative, needs ~30% lower quality to match Android file sizes
    return Math.round(quality * 0.7);
  }
  return quality;
};

export const createResizedImage = async (
  photo: ImageSource,
  instruction: ThumbnailInstruction & { width: number; height: number },
  format: 'webp' | 'png' | 'jpeg' = Platform.OS === 'android' ? 'webp' : 'jpeg'
) => {
  const platformQuality = getQualityForPlatform(instruction.quality);

  return await ImageResizer.createResizedImage(
    (photo.filepath || photo.uri) as string,
    instruction.width,
    instruction.height,
    format.toUpperCase() as ResizeFormat,
    platformQuality,
    0,
    undefined,
    false,
    {
      mode: 'cover', // Use 'cover' for square thumbnails to crop, or 'contain' to fit
      onlyScaleDown: false,
    }
  );
};
