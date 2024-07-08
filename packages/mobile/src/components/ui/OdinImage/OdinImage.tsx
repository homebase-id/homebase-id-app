import {
  EmbeddedThumb,
  ImageContentType,
  ImageSize,
  TargetDrive,
} from '@youfoundation/js-lib/core';
import { ReactNode, memo, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
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
  onLongPress?: (e: GestureResponderEvent) => void;
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
    onLongPress,
  }: OdinImageProps) => {
    // Don't set load size if it's a thumbnessLessContentType; As they don't have a thumb
    const loadSize = useMemo(
      () =>
        previewThumbnail?.contentType &&
        thumblessContentTypes.includes(previewThumbnail?.contentType)
          ? undefined
          : {
              pixelHeight:
                (imageSize?.height
                  ? Math.round(imageSize?.height * (enableZoom ? 6 : 1))
                  : undefined) || 800,
              pixelWidth:
                (imageSize?.width
                  ? Math.round(imageSize?.width * (enableZoom ? 6 : 1))
                  : undefined) || 800,
            },
      [enableZoom, imageSize?.height, imageSize?.width, previewThumbnail?.contentType]
    );

    const { getFromCache } = useImage();
    const cachedImage = useMemo(
      () =>
        fileId && fileKey
          ? getFromCache(odinId, fileId, fileKey, targetDrive, loadSize)
          : undefined,
      [fileId, fileKey, getFromCache, odinId, targetDrive, loadSize]
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

    const cachedImageSizeSameorGreater = useMemo(
      () =>
        (cachedImage?.size &&
          loadSize &&
          (cachedImage.size.pixelHeight >= loadSize.pixelHeight ||
            cachedImage.size.pixelWidth >= loadSize.pixelWidth)) ||
        false,
      [cachedImage?.size, loadSize]
    );

    const previewUrl = cachedImageSizeSameorGreater
      ? undefined
      : cachedImage?.imageData?.url || embeddedThumbUrl || tinyThumb?.url;
    const previewContentType =
      cachedImage?.imageData?.type || previewThumbnail?.contentType || tinyThumb?.contentType;

    const naturalSize: ImageSize | undefined = tinyThumb
      ? {
          pixelHeight: tinyThumb.naturalSize.height,
          pixelWidth: tinyThumb.naturalSize.width,
        }
      : cachedImage?.imageData?.naturalSize || previewThumbnail;

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

    const hasCachedImage = !!cachedImage?.imageData?.url;

    return (
      <>
        <View
          style={{
            position: 'relative',
            ...imageSize,
          }}
        >
          {/* Blurry image */}
          {/* Hide preview image when it's an enableZoom as the position absolute conflicts on the gestures */}
          {previewUrl && (!enableZoom || (enableZoom && !imageData?.url)) ? (
            <InnerImage
              uri={previewUrl}
              contentType={previewContentType as ImageContentType}
              style={{
                position: 'absolute', // Absolute so it takes up the full imageSize defined by the wrapper view
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                resizeMode: fit,
                zIndex: 5, // Displayed underneath the actual image
                ...style,
              }}
              alt={alt || title}
              imageMeta={{
                odinId,
                imageFileId: fileId,
                imageFileKey: fileKey,
                imageDrive: targetDrive,
                size: loadSize,
              }}
              imageSize={imageSize}
              blurRadius={hasCachedImage ? 0 : 2}
              // onLongPress={onLongPress}
            />
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
              onLongPress={onLongPress}
              style={{
                position: 'relative',
                ...style,
                zIndex: 10,
              }}
              imageMeta={{
                odinId,
                imageFileId: fileId,
                imageFileKey: fileKey,
                imageDrive: targetDrive,
                size: loadSize,
              }}
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
    onLongPress,
    contentType,
    imageMeta,
  }: {
    uri: string;
    imageSize?: { width: number; height: number };
    blurRadius?: number;
    alt?: string;
    style?: ImageStyle;
    fit?: 'cover' | 'contain';
    onLongPress?: (e: GestureResponderEvent) => void;
    onClick?: () => void;
    imageMeta?: {
      odinId: string | undefined;
      imageFileId: string | undefined;
      imageFileKey: string | undefined;
      imageDrive: TargetDrive;
      size?: ImageSize;
    };

    contentType?: ImageContentType;
  }) => {
    const ClickableWrapper = useCallback(
      ({ children }: { children: ReactNode }) =>
        onClick || onLongPress ? (
          <TouchableWithoutFeedback onPress={onClick} onLongPress={onLongPress}>
            {children}
          </TouchableWithoutFeedback>
        ) : (
          <>{children}</>
        ),
      [onClick, onLongPress]
    );

    const { invalidateCache } = useImage();
    return contentType === 'image/svg+xml' ? (
      <ClickableWrapper>
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
      </ClickableWrapper>
    ) : (
      <ClickableWrapper>
        <Image
          onError={() => {
            if (imageMeta) {
              return invalidateCache(
                imageMeta?.odinId,
                imageMeta?.imageFileId,
                imageMeta?.imageFileKey,
                imageMeta?.imageDrive,
                imageMeta?.size
              );
            }
          }}
          source={{ uri }}
          alt={alt}
          style={{
            resizeMode: fit,
            ...imageSize,
            ...style,
          }}
          blurRadius={blurRadius}
        />
      </ClickableWrapper>
    );
  }
);

const ZoomableImage = memo(
  ({
    uri,
    alt,
    imageSize,
    style,
    fit,
    enableZoom,
    onClick,
    onLongPress,
    contentType,
    imageMeta,
  }: {
    uri: string;
    imageSize?: { width: number; height: number };
    alt?: string;
    style?: ImageStyle;
    fit?: 'cover' | 'contain';
    enableZoom?: boolean;
    onClick?: () => void;
    onLongPress?: (e: GestureResponderEvent) => void;
    imageMeta?: {
      odinId: string | undefined;
      imageFileId: string | undefined;
      imageFileKey: string | undefined;
      imageDrive: TargetDrive;
      size?: ImageSize;
    };

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
          onLongPress={onLongPress}
          imageMeta={imageMeta}
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
            isDoubleTapEnabled={true}
            isPinchEnabled
            resizeMode="contain"
            style={{
              ...imageSize,
            }}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  }
);
