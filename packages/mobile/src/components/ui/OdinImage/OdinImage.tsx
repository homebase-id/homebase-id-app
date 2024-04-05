import {
  EmbeddedThumb,
  ImageContentType,
  ImageSize,
  TargetDrive,
} from '@youfoundation/js-lib/core';
import { memo, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  Platform,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import useImage from './hooks/useImage';
import useTinyThumb from './hooks/useTinyThumb';
import { SvgUri } from 'react-native-svg';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';

export interface OdinImageProps {
  odinId?: string;
  targetDrive: TargetDrive;
  fileId: string | undefined;
  fileKey?: string;
  lastModified?: number;
  fit?: 'cover' | 'contain';
  imageSize?: { width: number; height: number };
  alt?: string;
  title?: string;
  previewThumbnail?: EmbeddedThumb;
  avoidPayload?: boolean;
  enableZoom?: boolean;
  style?: ImageStyle;
  onClick?: () => void;
}

const thumblessContentTypes = ['image/svg+xml', 'image/gif'];

export const OdinImage = memo(
  ({
    odinId,
    targetDrive,
    fileId,
    fileKey,
    lastModified,
    fit,
    imageSize,
    alt,
    title,
    previewThumbnail,
    enableZoom,
    style,
    onClick,
  }: OdinImageProps) => {
    // Don't set load size if it's a thumbnessLessContentType; As they don't have a thumb
    const loadSize =
      previewThumbnail?.contentType && thumblessContentTypes.includes(previewThumbnail?.contentType)
        ? undefined
        :
        {
            pixelHeight:
              (imageSize?.height
                ? Math.round(imageSize?.height * (enableZoom ? 4 : 1))
                : undefined) || 800,
            pixelWidth:
              (imageSize?.width
                ? Math.round(imageSize?.width * (enableZoom ? 4 : 1))
                : undefined) || 800,
          };

    const { getFromCache } = useImage();
    const cachedImage = useMemo(
      () => (fileId && fileKey ? getFromCache(odinId, fileId, fileKey, targetDrive) : undefined),
      [fileId, getFromCache, odinId, targetDrive, fileKey]
    );

    const embeddedThumbUrl = useMemo(() => {
      if (!previewThumbnail) return;
      return `data:${previewThumbnail.contentType};base64,${previewThumbnail.content}`;
    }, [previewThumbnail]);

    const ignoreTiny = !!previewThumbnail || !!cachedImage;

    const { data: tinyThumb } = useTinyThumb({
      odinId,
      imageFileId: !ignoreTiny ? fileId : undefined,
      imageFileKey: fileKey,
      imageDrive: targetDrive,
    });

    const previewUrl = cachedImage?.url || embeddedThumbUrl || tinyThumb?.url;
    const previewContentType =
      cachedImage?.type || previewThumbnail?.contentType || tinyThumb?.contentType;

    const naturalSize: ImageSize | undefined = tinyThumb
      ? {
          pixelHeight: tinyThumb.naturalSize.height,
          pixelWidth: tinyThumb.naturalSize.width,
        }
      : cachedImage?.naturalSize || previewThumbnail;

    const {
      fetch: { data: imageData },
    } = useImage({
      odinId,
      imageFileId: fileId,
      imageFileKey: fileKey,
      imageDrive: targetDrive,
      size: loadSize,
      naturalSize,
      lastModified,
    });

    const hasCachedImage = !!cachedImage?.url;
    return (
      <>
        <View
          style={{
            position: 'relative',
            ...imageSize,
          }}
        >
          {/* Blurry image */}
          {previewUrl && !imageData?.url ? (
            <InnerImage
              uri={previewUrl}
              contentType={previewContentType as ImageContentType}
              style={{
                // position: imageData ? 'absolute' : 'relative',
                position: 'absolute', // Absolute so it takes up the full imageSize defined by the wrapper view
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                resizeMode: fit,
                ...style,
              }}
              imageSize={imageSize}
              blurRadius={hasCachedImage ? 0 : 2}
            />
          ) : null}

          {!imageData?.url && !previewUrl ? (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                ...imageSize,
                ...style,
              }}
            >
              <ActivityIndicator size="large" />
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
      </>
    );
  }
);

const InnerImage = memo(
  ({
    uri,
    alt,
    imageSize,
    blurRadius,
    style,
    fit,
    onClick,

    contentType,
  }: {
    uri: string;
    imageSize?: { width: number; height: number };
    blurRadius?: number;
    alt?: string;
    style?: ImageStyle;
    fit?: 'cover' | 'contain';

    onClick?: () => void;

    contentType?: ImageContentType;
  }) => {
    return contentType === 'image/svg+xml' ? (
      <TouchableWithoutFeedback onPress={onClick}>
        <View
          style={[
            {
              ...imageSize,
              ...style,
            },
            // SVGs styling are not supported on Android
            Platform.OS === 'android' ? style : undefined,
          ]}
        >
          <SvgUri
            width={imageSize?.width}
            height={imageSize?.height}
            uri={uri}
            style={{ overflow: 'hidden', ...style }}
          />
        </View>
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
          blurRadius={blurRadius}
        />
      </TouchableWithoutFeedback>
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
    return (
      <InnerImage
        uri={uri}
        alt={alt}
        imageSize={imageSize}
        style={style}
        fit={fit}
        contentType={contentType}
        onClick={onClick}
      />
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
