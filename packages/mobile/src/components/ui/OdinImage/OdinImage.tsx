import {
  EmbeddedThumb,
  ImageContentType,
  ImageSize,
  TargetDrive,
} from '@youfoundation/js-lib/core';
import { memo, useMemo } from 'react';
import { ActivityIndicator, Image, ImageStyle, TouchableWithoutFeedback, View } from 'react-native';
import useImage from './hooks/useImage';
import useTinyThumb from './hooks/useTinyThumb';
import { SvgUri } from 'react-native-svg';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';

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
  enableZoom?: boolean;
  fileKey?: string;
  style?: ImageStyle;
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
    enableZoom,
    style,
    onClick,
  }: OdinImageProps) => {
    const loadSize = {
      pixelHeight:
        (imageSize?.height ? Math.round(imageSize?.height * (enableZoom ? 4 : 1)) : undefined) ||
        800,
      pixelWidth:
        (imageSize?.width ? Math.round(imageSize?.width * (enableZoom ? 4 : 1)) : undefined) || 800,
    };

    const embeddedThumbUrl = useMemo(() => {
      if (!previewThumbnail) return;

      return `data:${previewThumbnail.contentType};base64,${previewThumbnail.content}`;
    }, [previewThumbnail]);

    const { getFromCache } = useImage();
    const cachedImage = useMemo(
      () => (fileId && fileKey ? getFromCache(odinId, fileId, fileKey, targetDrive) : undefined),
      [fileId, getFromCache, odinId, targetDrive, fileKey]
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
      enableZoom || loadSize !== undefined ? fileId : undefined,
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
        {!enableZoom && previewUrl ? (
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
              ...style,
            }}
            blurRadius={hasCachedImage ? 0 : 2}
          />
        ) : null}

        {!imageData?.url && !hasCachedImage ? (
          <View
            style={{
              ...imageSize,
              justifyContent: 'center',
              alignItems: 'center',
              ...style,
            }}
          >
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
            style={style}
          />
        ) : null}
      </View>
    );
  }
);

const ZoomableImage = ({
  uri,
  alt,
  imageSize,
  style,
  fit,
  enableZoom,
  onClick,

  contentType,
}: {
  uri: string;
  imageSize?: { width: number; height: number };
  alt?: string;
  style?: ImageStyle;
  fit?: 'cover' | 'contain';
  enableZoom?: boolean;
  onClick?: () => void;

  contentType?: ImageContentType;
}) => {
  if (!enableZoom) {
    return contentType === 'image/svg+xml' ? (
      <TouchableWithoutFeedback onPress={onClick}>
        <SvgUri
          width={imageSize?.width}
          height={imageSize?.height}
          uri={uri}
          style={{ overflow: 'hidden', ...style }}
        />
      </TouchableWithoutFeedback>
    ) : (
      <TouchableWithoutFeedback onPress={onClick}>
        <Image
          source={{ uri }}
          alt={alt}
          style={{
            resizeMode: fit,
            ...imageSize,
            ...style,
          }}
        />
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={onClick}>
      <View
        style={{
          ...imageSize,
        }}
      >
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
