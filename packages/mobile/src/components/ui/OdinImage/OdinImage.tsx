import { EmbeddedThumb, ImageSize, SystemFileType, TargetDrive } from '@homebase-id/js-lib/core';
import { memo, useMemo, useState, useEffect } from 'react';
import { ImageStyle, Platform, View, TouchableWithoutFeedback } from 'react-native';
import useImage from './hooks/useImage';
import { SvgUri } from 'react-native-svg';
import { ImageZoom, ImageZoomProps } from '@likashefqet/react-native-image-zoom';
import Animated, { runOnJS, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureType } from 'react-native-gesture-handler';
import { drivesEqual } from '@homebase-id/js-lib/helpers';
import { OdinBlob } from '../../../../polyfills/OdinBlob';

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
  onLongPress?: (coords: { x: number; y: number; absoluteX: number; absoluteY: number }) => void;
  imageZoomProps?: ImageZoomProps;
  probablyEncrypted?: boolean;
  systemFileType?: SystemFileType;
  gestureRefs?: React.RefObject<GestureType | undefined>[];
  pendingFile?: OdinBlob;
}

const thumblessContentTypes = ['image/svg+xml', 'image/gif'];

export const OdinImage = memo(
  (props: OdinImageProps) => {
    const {
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
      gestureRefs,
      pendingFile,
    } = props;

    // Don't set load size if it's a thumbnessLessContentType; As they don't have a thumb
    // const renderCount = useRef(0);
    // renderCount.current += 1;
    // console.log(`OdinImage rendered ${renderCount.current} times for fileId: ${fileId}`);

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

    const {
      fetch: { data: imageData },
    } = useImage({
      odinId,
      imageFileId: fileId,
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

    const uri = imageData?.url || embeddedThumbUrl || pendingFile?.uri;
    if (!uri) return null;
    // console.log(`OdinImage URI updated to: ${uri} for fileId: ${fileId}`);
    // console.log(`imageData present: ${!!imageData}`);

    if (enableZoom) {
      return (
        <ZoomableImage
          key={`${fileId || globalTransitId}_${fileKey}_${imageData ? '1' : '0'}`}
          uri={uri}
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
      <InnerImage
        key={`${fileId || globalTransitId}_${fileKey}_${imageData ? '1' : '0'}`}
        uri={uri}
        contentType={imageData?.type || previewThumbnail?.contentType}
        style={style}
        alt={alt || title}
        imageMeta={imageMeta}
        imageSize={imageSize}
        fit={fit}
        blurRadius={!imageData ? 2 : 0}
        onPress={onClick}
        onLongPress={onLongPress}
        gestureRefs={gestureRefs}
      />
    );
  },
  (prevProps: OdinImageProps, nextProps: OdinImageProps) => {
    // Custom comparison as targetDrive and imageSize are complex types but often the same
    if (!drivesEqual(prevProps.targetDrive, nextProps.targetDrive)) return false;
    if (
      prevProps.imageSize?.width !== nextProps.imageSize?.width ||
      prevProps.imageSize?.height !== nextProps.imageSize?.height
    ) {
      return false;
    }
    return Object.keys(prevProps).every(
      (key) =>
        ['targetDrive', 'imageSize'].includes(key) ||
        prevProps[key as keyof OdinImageProps] === nextProps[key as keyof OdinImageProps]
    );
  }
);

const InnerImage = memo(
  (props: {
    uri: string | undefined;
    imageSize?: { width: number; height: number };
    blurRadius?: number;
    alt?: string;
    style?: ImageStyle;
    fit?: 'cover' | 'contain';
    onLoad?: () => void;
    onLongPress?: (coords: { x: number; y: number; absoluteX: number; absoluteY: number }) => void;
    onPress?: () => void;
    gestureRefs?: React.RefObject<GestureType | undefined>[];
    imageMeta?: {
      odinId: string | undefined;
      imageFileId: string | undefined;
      imageFileKey: string | undefined;
      imageDrive: TargetDrive;
      size?: ImageSize;
    };
    contentType: string | undefined;
  }) => {
    const {
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
      gestureRefs,
    } = props;

    const { invalidateCache } = useImage();

    const opacity = useSharedValue(0);

    const [placeholderUri, setPlaceholderUri] = useState<string | undefined>(undefined);

    useEffect(() => {
      if (uri && uri !== placeholderUri) {
        setPlaceholderUri(uri);
        opacity.value = 0;
      }
    }, [uri]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const handleLoadEnd = () => {
      opacity.value = withTiming(1, { duration: 300 });
      if (onLoad) onLoad();
    };

    const tapGesture = useMemo(() => {
      const tap = Gesture.Tap().onStart(() => {
        if (onPress) {
          runOnJS(onPress)();
        }
      });
      if (gestureRefs) {
        const externalGestures = gestureRefs
          .map((ref) => ref.current)
          .filter(Boolean) as GestureType[];
        tap.requireExternalGestureToFail(...externalGestures);
      }
      return tap;
    }, [gestureRefs, onPress]);

    const longPressGesture = useMemo(
      () =>
        Gesture.LongPress().onStart((e) => {
          const coords = {
            x: e.x,
            y: e.y,
            absoluteX: e.absoluteX,
            absoluteY: e.absoluteY,
          };
          if (onLongPress) {
            runOnJS(onLongPress)(coords);
          }
        }),
      [onLongPress]
    );

    const composedGesture = useMemo(
      () => Gesture.Exclusive(longPressGesture, tapGesture),
      [longPressGesture, tapGesture]
    );

    return (
      <GestureDetector gesture={composedGesture}>
        <View style={{ position: 'relative', ...imageSize, ...style }}>
          {placeholderUri && (
            <Animated.Image
              source={{ uri: placeholderUri }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                resizeMode: 'contain',
              }}
              blurRadius={blurRadius}
            />
          )}
          {contentType === 'image/svg+xml' ? (
            <Animated.View
              style={[
                { overflow: 'hidden' },
                Platform.OS === 'android' ? style : undefined,
              ]}
            >
              <SvgUri
                width={imageSize?.width}
                height={imageSize?.height}
                uri={uri || null}
                style={[{ overflow: 'hidden' }, Platform.OS === 'android' ? undefined : style]}
                onLoad={handleLoadEnd}
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
              onLoadEnd={handleLoadEnd}
              source={uri ? { uri } : undefined}
              alt={alt}
              style={[
                {
                  resizeMode: fit,
                  flex: 1,
                },
                animatedStyle,
              ]}
              blurRadius={0}
            />
          )}
        </View>
      </GestureDetector>
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
    onLongPress?: (coords: { x: number; y: number; absoluteX: number; absoluteY: number }) => void;
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

    const opacity = useSharedValue(0);

    const [placeholderUri, setPlaceholderUri] = useState<string | undefined>(undefined);

    useEffect(() => {
      if (uri && uri !== placeholderUri) {
        setPlaceholderUri(uri);
        opacity.value = 0;
      }
    }, [uri]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const handleLoadEnd = () => {
      opacity.value = withTiming(1, { duration: 300 });
      if (onLoad) onLoad();
    };

    return (
      <TouchableWithoutFeedback
        onPress={onPress}
        onLongPress={(e) =>
          onLongPress?.({
            x: e.nativeEvent.locationX,
            y: e.nativeEvent.locationY,
            absoluteX: e.nativeEvent.pageX,
            absoluteY: e.nativeEvent.pageY,
          })
        }
      >
        <Animated.View style={{ ...imageSize }}>
          <View style={{ position: 'relative', flex: 1 }}>
            {placeholderUri && (
              <Animated.Image
                source={{ uri: placeholderUri }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  resizeMode: 'contain',
                }}
                blurRadius={blurRadius}
              />
            )}
            <ImageZoom
              uri={uri}
              onLoadEnd={handleLoadEnd}
              minScale={1}
              maxScale={3}
              isDoubleTapEnabled={true}
              isPinchEnabled
              resizeMode="contain"
              style={[{ flex: 1, ...style }, animatedStyle]}
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
              blurRadius={0}
            />
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
);