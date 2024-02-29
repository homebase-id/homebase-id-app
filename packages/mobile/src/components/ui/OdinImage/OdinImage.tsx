import {
  TargetDrive,
  EmbeddedThumb,
  ImageSize,
  ImageContentType,
} from '@youfoundation/js-lib/core';
import { memo, useMemo } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import useImage from './hooks/useImage';
import useTinyThumb from './hooks/useTinyThumb';
import { SvgUri } from 'react-native-svg';

export interface OdinImageProps {
  odinId?: string;
  targetDrive: TargetDrive;
  fileId: string | undefined;
  fileKey: string | undefined;
  fit?: 'cover' | 'contain';
  imageSize?: { width: number; height: number };
  alt?: string;
  title?: string;
  previewThumbnail?: EmbeddedThumb;
  probablyEncrypted?: boolean;
  avoidPayload?: boolean;
}

export const OdinImage = memo(
  ({
    odinId,
    targetDrive,
    fileId,
    fileKey,
    fit,
    imageSize,
    alt,
    title,
    previewThumbnail,
    avoidPayload,
  }: OdinImageProps) => {
    const loadSize = {
      pixelHeight: (imageSize?.height ? Math.round(imageSize?.height * 1) : undefined) || 800,
      pixelWidth: (imageSize?.width ? Math.round(imageSize?.width * 1) : undefined) || 800,
    };

    const embeddedThumbUrl = useMemo(() => {
      if (!previewThumbnail) return;

      return `data:${previewThumbnail.contentType};base64,${previewThumbnail.content}`;
    }, [previewThumbnail]);

    const { getFromCache } = useImage();
    const cachedImage = useMemo(
      () => (fileId && fileKey ? getFromCache(odinId, fileId, fileKey, targetDrive) : undefined),
      [fileId, getFromCache, odinId, targetDrive]
    );
    const skipTiny = !!previewThumbnail || !!cachedImage;

    const { data: tinyThumb } = useTinyThumb(
      odinId,
      !skipTiny ? fileId : undefined,
      fileKey,
      targetDrive
    );
    const previewUrl = cachedImage?.url || embeddedThumbUrl || tinyThumb?.url;

    const naturalSize: ImageSize | undefined = tinyThumb
      ? {
          pixelHeight: tinyThumb.naturalSize.height,
          pixelWidth: tinyThumb.naturalSize.width,
        }
      : cachedImage?.naturalSize || previewThumbnail;

    const {
      fetch: { data: imageData },
    } = useImage(
      odinId,
      loadSize !== undefined ? fileId : undefined,
      fileKey,
      targetDrive,
      avoidPayload ? { pixelHeight: 200, pixelWidth: 200 } : loadSize,
      naturalSize
    );

    const hasCachedImage = !!cachedImage?.url;

    return (
      <View
        style={{
          position: 'relative',
        }}
      >
        {/* Blurry image */}
        {previewUrl ? (
          <Image
            source={{ uri: previewUrl }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              resizeMode: fit,

              ...imageSize,
            }}
            blurRadius={hasCachedImage ? 0 : 2}
          />
        ) : null}

        {!imageData?.url && !hasCachedImage ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              ...imageSize,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator style={{}} size="large" />
          </View>
        ) : null}

        {/* Actual image */}
        {imageData?.url ? (
          <InnerImage
            uri={imageData.url}
            contentType={imageData.type}
            fit={fit}
            imageSize={imageSize}
            alt={alt || title}
          />
        ) : null}
      </View>
    );
  }
);

const InnerImage = ({
  uri,
  alt,
  imageSize,

  fit,

  contentType,
}: {
  uri: string;
  imageSize?: { width: number; height: number };
  alt?: string;

  fit?: 'cover' | 'contain';

  contentType?: ImageContentType;
}) => {
  return contentType === 'image/svg+xml' ? (
    <SvgUri width={imageSize?.width} height={imageSize?.height} uri={uri} />
  ) : (
    <Image
      source={{ uri }}
      alt={alt}
      style={{
        resizeMode: fit,

        ...imageSize,
      }}
    />
  );
};
