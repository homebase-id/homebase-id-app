import { EmbeddedThumb, ImageSize, SystemFileType, TargetDrive } from '@homebase-id/js-lib/core';
import { memo, useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  ImageStyle,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import useImage from './hooks/useImage';
import { SvgUri } from 'react-native-svg';
import { ImageZoom, ImageZoomProps } from '@likashefqet/react-native-image-zoom';
import Animated from 'react-native-reanimated';

export interface OdinImageProps {
  odinId?: string;
  targetDrive: TargetDrive;
  fileId: string | undefined;
  fileKey?: string;
  lastModified?: number;
  globalTransitId?: string;
  fit?: 'cover' | 'contain';
  imageSize?: { width: number; height: number };
  alt?: string;
  title?: string;
  previewThumbnail: EmbeddedThumb | undefined;
  avoidPayload?: boolean;
  enableZoom?: boolean;
  style?: ImageStyle;
  onClick?: () => void;
  onLongPress?: (e: GestureResponderEvent) => void;

  imageZoomProps?: ImageZoomProps;
  probablyEncrypted?: boolean;
  systemFileType?: SystemFileType;
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
    imageZoomProps,
    globalTransitId,
    probablyEncrypted,
    systemFileType,
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
      [enableZoom, imageSize, previewThumbnail]
    );

    const embeddedThumbUrl = useMemo(() => {
      if (!previewThumbnail) return;
      return `data:${previewThumbnail.contentType};base64,${previewThumbnail.content}`;
    }, [previewThumbnail]);

    const [thumbLoaded, setThumbLoaded] = useState(false);
    const loadFinal = !embeddedThumbUrl || (!!embeddedThumbUrl && thumbLoaded);

    const {
      fetch: { data: imageData },
    } = useImage({
      odinId,
      imageFileId: loadFinal ? fileId : undefined,
      imageFileKey: fileKey,
      imageGlobalTransitId: globalTransitId,
      imageDrive: targetDrive,
      probablyEncrypted,
      size: loadSize,
      lastModified,
      systemFileType,
    });

    const imageMeta = useMemo(
      () => ({
        odinId,
        imageFileId: fileId,
        imageFileKey: fileKey,
        imageDrive: targetDrive,
        size: loadSize,
      }),
      [fileId, fileKey, loadSize, odinId, targetDrive]
    );

    if (enableZoom) {
      return (
        <ZoomableImage
          onLoad={() => setThumbLoaded(true)}
          uri={imageData?.url || embeddedThumbUrl}
          imageSize={imageSize}
          alt={alt || title}
          onPress={onClick}
          onLongPress={onLongPress}
          style={style}
          imageMeta={imageMeta}
          imageZoomProps={imageZoomProps}
          blurRadius={!imageData ? 2 : 0}
        />
      );
    }

    return (
      <>
        <InnerImage
          onLoad={() => setThumbLoaded(true)}
          uri={imageData?.url || embeddedThumbUrl || ''}
          contentType={imageData?.type || previewThumbnail?.contentType}
          style={style}
          alt={alt || title}
          imageMeta={imageMeta}
          imageSize={imageSize}
          fit={fit}
          blurRadius={!imageData ? 2 : 0}
          onPress={onClick}
          onLongPress={onLongPress}
        />
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
    onLoad,
    onPress,
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
    onLoad?: () => void;
    onLongPress?: (e: GestureResponderEvent) => void;
    onPress?: () => void;
    imageMeta?: {
      odinId: string | undefined;
      imageFileId: string | undefined;
      imageFileKey: string | undefined;
      imageDrive: TargetDrive;
      size?: ImageSize;
    };

    contentType: string | undefined;
  }) => {
    const { invalidateCache } = useImage();
    return (
      <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress}>
        {contentType === 'image/svg+xml' ? (
          <Animated.View
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
              onLoad={onLoad}
            />
          </Animated.View>
        ) : (
          <Animated.Image
            onError={
              imageMeta
                ? () =>
                    invalidateCache(
                      imageMeta?.odinId,
                      imageMeta?.imageFileId,
                      imageMeta?.imageFileKey,
                      imageMeta?.imageDrive,
                      imageMeta?.size
                    )
                : undefined
            }
            onLoadEnd={onLoad}
            source={uri ? { uri } : undefined}
            alt={alt}
            style={{
              resizeMode: fit,
              ...imageSize,
              ...style,
            }}
            blurRadius={blurRadius}
          />
        )}
      </TouchableWithoutFeedback>
    );
  }
);

const ZoomableImage = memo(
  ({
    uri,
    imageSize,
    onPress,
    onLongPress,
    imageMeta,
    imageZoomProps,

    alt,
    style,
    onLoad,
    blurRadius,
  }: {
    uri: string | undefined;
    imageSize?: { width: number; height: number };
    onPress?: () => void;
    onLongPress?: (e: GestureResponderEvent) => void;
    imageMeta?: {
      odinId: string | undefined;
      imageFileId: string | undefined;
      imageFileKey: string | undefined;
      imageDrive: TargetDrive;
      size?: ImageSize;
    };

    imageZoomProps?: ImageZoomProps;

    alt?: string;
    style?: ImageStyle;
    onLoad?: () => void;
    blurRadius?: number;
  }) => {
    const { invalidateCache } = useImage();
    return (
      <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress}>
        <Animated.View
          style={{
            ...imageSize,
          }}
        >
          <ImageZoom
            uri={uri}
            onLoadEnd={onLoad}
            minScale={1}
            maxScale={3}
            isDoubleTapEnabled={true}
            isPinchEnabled
            resizeMode="contain"
            style={{
              ...imageSize,
              ...style,
            }}
            onError={
              imageMeta
                ? () =>
                    invalidateCache(
                      imageMeta?.odinId,
                      imageMeta?.imageFileId,
                      imageMeta?.imageFileKey,
                      imageMeta?.imageDrive,
                      imageMeta?.size
                    )
                : undefined
            }
            alt={alt}
            {...imageZoomProps}
            blurRadius={blurRadius}
          />
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
);
