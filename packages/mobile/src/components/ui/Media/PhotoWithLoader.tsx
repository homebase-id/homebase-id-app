import {
  EmbeddedThumb,
  ImageContentType,
  ImageSize,
  TargetDrive,
} from '@youfoundation/js-lib/core';
import { memo, useMemo } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import useImage from '../OdinImage/hooks/useImage';
import useTinyThumb from '../OdinImage/hooks/useTinyThumb';

// Memo to performance optimize the FlatList
export const PhotoWithLoader = memo(
  ({
    fileId,
    targetDrive,
    previewThumbnail,
    fit = 'cover',
    imageSize,
    enableZoom,
    fileKey,
    onClick,
  }: {
    fileId: string;
    fileKey: string;
    targetDrive: TargetDrive;
    previewThumbnail?: EmbeddedThumb;
    fit?: 'cover' | 'contain';
    imageSize?: { width: number; height: number };
    enableZoom?: boolean;
    onClick?: () => void;
  }) => {
    return (
      <OdinImage
        targetDrive={targetDrive}
        fileId={fileId}
        fileKey={fileKey}
        previewThumbnail={previewThumbnail}
        fit={fit}
        imageSize={imageSize}
        enableZoom={enableZoom}
        onClick={onClick}
      />
    );
  },
);

export interface OdinImageProps {
  odinId?: string;
  targetDrive: TargetDrive;
  fileId: string | undefined;
  fit?: 'cover' | 'contain';
  imageSize?: { width: number; height: number };
  alt?: string;
  title?: string;
  previewThumbnail?: EmbeddedThumb;
  avoidPayload?: boolean;
  probablyEncrypted?: boolean;
  enableZoom?: boolean;
  fileKey?: string;
  onClick?: () => void;
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
    probablyEncrypted,
    enableZoom,
    onClick,
  }: OdinImageProps) => {
    const loadSize = {
      pixelHeight:
        (imageSize?.height
          ? Math.round(imageSize?.height * (enableZoom ? 4 : 1))
          : undefined) || 800,
      pixelWidth:
        (imageSize?.width
          ? Math.round(imageSize?.width * (enableZoom ? 4 : 1))
          : undefined) || 800,
    };

    const embeddedThumbUrl = useMemo(() => {
      if (!previewThumbnail) return;

      return `data:${previewThumbnail.contentType};base64,${previewThumbnail.content}`;
    }, [previewThumbnail]);

    const { getFromCache } = useImage();
    const cachedImage = useMemo(
      () => (fileId ? getFromCache(odinId, fileId, targetDrive) : undefined),
      [fileId, getFromCache, odinId, targetDrive],
    );
    const skipTiny = !!previewThumbnail || !!cachedImage;

    const { data: tinyThumb } = useTinyThumb(
      odinId,
      !skipTiny ? fileId : undefined,
      fileKey,
      targetDrive,
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
      enableZoom || loadSize !== undefined ? fileId : undefined,
      fileKey,
      targetDrive,
      avoidPayload ? { pixelHeight: 200, pixelWidth: 200 } : loadSize,
      probablyEncrypted,
      naturalSize,
    );

    const hasCachedImage = !!cachedImage?.url;

    return (
      <View
        style={{
          position: 'relative',
        }}>
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
            }}>
            <ActivityIndicator style={{}} size="large" />
          </View>
        ) : null}

        {/* Actual image */}
        {imageData?.url ? (
          <ZoomableImage
            uri={imageData.url}
            contentType={imageData.type}
            fit={fit}
            imageSize={imageSize}
            enableZoom={enableZoom}
            alt={alt || title}
            onClick={onClick}
          />
        ) : null}
      </View>
    );
  },
);

const ZoomableImage = ({
  uri,
  alt,
  imageSize,

  fit,
  enableZoom,
  onClick,

  contentType,
}: {
  uri: string;
  imageSize?: { width: number; height: number };
  alt?: string;

  fit?: 'cover' | 'contain';
  enableZoom?: boolean;
  onClick?: () => void;

  contentType?: ImageContentType;
}) => {
  if (!enableZoom) {
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
  }

  return (
    <TouchableWithoutFeedback onPress={onClick}>
      <View
        style={{
          ...imageSize,
        }}>
        <ImageZoom
          uri={uri}
          minScale={1}
          maxScale={3}
          resizeMode="contain"
          style={{
            ...imageSize,
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};
