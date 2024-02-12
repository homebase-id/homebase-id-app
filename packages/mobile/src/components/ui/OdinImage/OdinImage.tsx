import { TargetDrive, EmbeddedThumb, ImageSize } from '@youfoundation/js-lib/core';
import { base64ToUint8Array, byteArrayToString } from '@youfoundation/js-lib/helpers';
import { useMemo } from 'react';
import { View, Image, ActivityIndicator, StyleProp, ImageStyle, ViewStyle } from 'react-native';
import useImage from './hooks/useImage';
import useTinyThumb from './hooks/useTinyThumb';
import { useAuth } from '../../../hooks/auth/useAuth';
import { SvgXml } from 'react-native-svg';
import { useDotYouClientContext } from 'feed-app-common';

export interface OdinImageProps {
  odinId?: string;
  targetDrive: TargetDrive;
  fileId: string | undefined;
  fileKey: string | undefined;
  fit?: 'cover' | 'contain';
  imageSize?: { width: number; height: number };
  alt?: string;
  previewThumbnail?: EmbeddedThumb;
  probablyEncrypted?: boolean;
  avoidPayload?: boolean;
  style?: StyleProp<ImageStyle>;
}

export const OdinImage = ({
  odinId,
  targetDrive,
  fileId,
  fileKey,
  fit,
  imageSize,
  alt,
  previewThumbnail,
  probablyEncrypted,
  avoidPayload,
  style,
}: OdinImageProps) => {
  const dotYouClient = useDotYouClientContext();

  const loadSize = {
    pixelHeight: (imageSize?.height ? Math.round(imageSize?.height * 1) : undefined) || 800,
    pixelWidth: (imageSize?.width ? Math.round(imageSize?.width * 1) : undefined) || 800,
  };

  const embeddedThumbUrl = useMemo(() => {
    if (!previewThumbnail) return;

    return `data:${previewThumbnail.contentType};base64,${previewThumbnail.content}`;
  }, [previewThumbnail]);

  const { getFromCache } = useImage(dotYouClient);
  const cachedImage = useMemo(
    () => (fileId ? getFromCache(odinId, fileId, targetDrive) : undefined),
    [fileId, getFromCache, odinId, targetDrive]
  );
  const skipTiny = !!previewThumbnail || !!cachedImage;

  const { data: tinyThumb } = useTinyThumb(
    dotYouClient,
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
    dotYouClient,
    odinId,
    loadSize !== undefined ? fileId : undefined,
    fileKey,
    targetDrive,
    avoidPayload ? { pixelHeight: 200, pixelWidth: 200 } : loadSize,
    probablyEncrypted,
    naturalSize
  );

  return (
    <View
      style={{
        position: 'relative',
        width: imageSize?.width,
        height: imageSize?.height,
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
          blurRadius={2}
        />
      ) : null}

      {!imageData?.url ? (
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
      ) : imageData?.url.indexOf('svg') !== -1 ? (
        <SvgImage style={style} imageSize={imageSize} uri={imageData.url} />
      ) : (
        <Image
          source={{ uri: imageData.url }}
          alt={alt}
          style={{
            resizeMode: fit,
            ...imageSize,
            ...style,
          }}
        />
      )}
    </View>
  );
};

const SvgImage = ({
  uri,
  style,
  imageSize,
}: {
  uri: string;
  style: StyleProp<ViewStyle>;
  imageSize: { width: number; height: number } | undefined;
}) => {
  const base64Data = uri.split('base64,').pop();
  if (!base64Data) return;
  const xmlString = byteArrayToString(base64ToUint8Array(base64Data));
  if (!xmlString) return;

  return (
    <SvgXml style={style} xml={xmlString} width={imageSize?.width} height={imageSize?.height} />
  );
};
