import {
  Image,
  ImageBackground,
  ImageStyle,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BoringFile } from './BoringFile';
import { OdinImage } from '../OdinImage/OdinImage';
import {
  EmbeddedThumb,
  NewPayloadDescriptor,
  PayloadDescriptor,
  TargetDrive,
} from '@homebase-id/js-lib/core';
import { Text } from '../Text/Text';
import { ChatDrive } from '../../../provider/chat/ConversationProvider';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { CHAT_LINKS_PAYLOAD_KEY } from '../../../provider/chat/ChatProvider';
import { OdinBlob } from '../../../../polyfills/OdinBlob';
import { t } from 'homebase-id-app-common';
import { VideoWithLoader } from './VideoWithLoader';
import { OdinAudio } from '../OdinAudio/OdinAudio';
import { LinkPreviewFile } from './LinkPreviewFile';
import { POST_LINKS_PAYLOAD_KEY } from '@homebase-id/js-lib/public';
import { Colors } from '../../../app/Colors';
import { memo, useCallback, useMemo, useState } from 'react';
import { LinkPreviewDescriptor } from '@homebase-id/js-lib/media';
import { tryJsonParse } from '@homebase-id/js-lib/helpers';
import { GestureType } from 'react-native-gesture-handler';

const GAP_SIZE = 2;
export const MediaGallery = memo(
  ({
    fileId,
    payloads,
    onLongPress,
    onClick,
    targetDrive,
    probablyEncrypted,
    previewThumbnail,
    odinId,
    globalTransitId,
    style,
    gestureRefs,
    hasText,
  }: {
    fileId: string;
    globalTransitId?: string;
    probablyEncrypted?: boolean;
    odinId?: string;
    onLongPress?: (coords: { x: number; y: number; absoluteX: number; absoluteY: number }) => void;
    targetDrive: TargetDrive;
    previewThumbnail?: EmbeddedThumb | undefined;
    payloads: PayloadDescriptor[];
    onClick?: (currIndex: number) => void;
    style?: StyleProp<ViewStyle>;
    gestureRefs?: React.RefObject<GestureType | undefined>[];
    hasText?: boolean;
  }) => {
    const maxVisible = 4;
    const countExcludedFromView = payloads?.length - maxVisible;
    const [wrapperWidth, setWrapperWidth] = useState<number | undefined>(undefined);

    const imageSize = useCallback(
      (index: number) => {
        if (!wrapperWidth) return null;

        return {
          width: payloads.length === 3 && index === 2 ? wrapperWidth : wrapperWidth / 2 - GAP_SIZE,
          height: wrapperWidth / 2 - GAP_SIZE,
        };
      },
      [payloads.length, wrapperWidth]
    );

    const embeddedThumbUrl = useMemo(() => {
      if (!previewThumbnail) return;
      return `data:${previewThumbnail.contentType};base64,${previewThumbnail.content}`;
    }, [previewThumbnail]);

    return (
      <View
        style={[
          styles.grid,
          style,
          {
            flex: 1,
            width: '100%',
            aspectRatio: payloads.length > 2 ? 1 : 2,
            position: 'relative',
          },
        ]}
        onLayout={(e) => setWrapperWidth(e.nativeEvent.layout.width)}
      >
        <ImageBackground
          source={{ uri: embeddedThumbUrl }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            opacity: wrapperWidth ? 0 : 1,
          }}
          blurRadius={2}
        />
        {payloads.slice(0, maxVisible).map((item, index) => {
          const size = imageSize(index);
          if (!size) return null;

          // Determine if this item should have bottom border radius
          const isBottomLeft = index === 2 || (index === 0 && payloads.length === 2);
          const isBottomRight =
            index === 3 ||
            (payloads.length === 3 && index === 2) ||
            (index === 1 && payloads.length === 2);

          return (
            <MediaItem
              key={item.key || index}
              payload={item}
              fileId={fileId}
              probablyEncrypted={probablyEncrypted}
              globalTransitId={globalTransitId}
              odinId={odinId}
              previewThumbnail={item.previewThumbnail}
              targetDrive={targetDrive}
              gestureRefs={gestureRefs}
              imageSize={size}
              containerStyle={{
                flexGrow: 1,
              }}
              style={{
                borderTopLeftRadius: index === 0 ? 10 : 0,
                borderBottomLeftRadius: isBottomLeft ? (hasText ? 0 : 10) : 0,
                borderTopRightRadius: index === 1 ? 10 : 0,
                borderBottomRightRadius: isBottomRight ? (hasText ? 0 : 10) : 0,
              }}
              onLongPress={onLongPress}
              onClick={() => {
                return onClick?.(index);
              }}
            />
          );
        })}
        {countExcludedFromView > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              top: 0,
              left: 0,
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            <Pressable
              style={{
                ...(imageSize(3) || { width: 0, heigth: 0 }),
                marginTop: 'auto',
                marginLeft: 'auto',

                backgroundColor: 'rgba(0,0,0,0.5)',
                alignItems: 'center',
                justifyContent: 'center',

                borderBottomRightRadius: hasText ? 0 : 10,
              }}
              onLongPress={(e) =>
                onLongPress?.({
                  x: e.nativeEvent.locationX,
                  y: e.nativeEvent.locationY,
                  absoluteX: e.nativeEvent.pageX,
                  absoluteY: e.nativeEvent.pageY,
                })
              }
              onPress={() => onClick?.(maxVisible - 1)}
            >
              <Text style={{ color: 'white', fontSize: 22, fontWeight: '500' }}>
                +{countExcludedFromView}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }
);

export const MediaItem = memo(
  ({
    payload,
    containerStyle,
    style,
    imageSize,
    onLongPress,
    fit,
    onClick,
    position,
    fileId,
    previewThumbnail,
    targetDrive = ChatDrive,
    probablyEncrypted,
    globalTransitId,
    odinId,
    gestureRefs,
  }: {
    payload: PayloadDescriptor | NewPayloadDescriptor;
    containerStyle?: StyleProp<ViewStyle>;
    fileId: string;
    globalTransitId?: string;
    previewThumbnail?: EmbeddedThumb | undefined;
    targetDrive: TargetDrive;
    probablyEncrypted?: boolean;
    odinId?: string;
    style?: ImageStyle;
    fit?: 'cover' | 'contain';
    position?: 'left' | 'right';
    imageSize:
      | {
          width: number;
          height: number;
        }
      | undefined;
    onLongPress:
      | ((coords: { x: number; y: number; absoluteX: number; absoluteY: number }) => void)
      | undefined;
    onClick: () => void;
    gestureRefs?: React.RefObject<GestureType | undefined>[];
  }) => {
    const { isDarkMode } = useDarkMode();

    const isVideo =
      payload.contentType?.startsWith('video') ||
      payload.contentType === 'application/vnd.apple.mpegurl';
    const isAudio = payload.contentType?.startsWith('audio');
    const isImage = payload.contentType?.startsWith('image');
    const isLink = payload.key === CHAT_LINKS_PAYLOAD_KEY || payload.key === POST_LINKS_PAYLOAD_KEY;
    if (
      !fileId ||
      !payload.contentType ||
      !payload.key ||
      (isImage && !!(payload as NewPayloadDescriptor).pendingFile)
    ) {
      if (isImage && (payload as NewPayloadDescriptor).pendingFile) {
        return (
          <Image
            src={((payload as NewPayloadDescriptor).pendingFile as unknown as OdinBlob)?.uri}
            style={{ ...imageSize, ...(style || { borderRadius: 10 }) }}
          />
        );
      }
      const progressPercentage = Math.round(
        ((payload as NewPayloadDescriptor).uploadProgress?.progress || 0) * 100
      );
      if (isVideo) {
        return (
          <View
            style={{
              backgroundColor: isDarkMode ? Colors.slate[700] : Colors.slate[300],
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              ...imageSize,
              ...(style || { borderRadius: 10 }),
            }}
          >
            <Text style={{ fontSize: 48 }}>📹</Text>
            {(payload as NewPayloadDescriptor).uploadProgress ? (
              <Text style={{ fontSize: 14 }}>
                {t((payload as NewPayloadDescriptor).uploadProgress?.phase)}{' '}
                {progressPercentage !== 0 ? `${progressPercentage}%` : ''}
              </Text>
            ) : null}
          </View>
        );
      }
    }

    if (isVideo) {
      return (
        <View style={containerStyle}>
          <VideoWithLoader
            fileId={fileId}
            payload={payload}
            targetDrive={targetDrive}
            previewThumbnail={previewThumbnail}
            globalTransitId={globalTransitId}
            probablyEncrypted={probablyEncrypted}
            odinId={odinId}
            lastModified={payload.lastModified}
            fit={fit}
            imageSize={imageSize}
            preview
            style={
              style || {
                borderRadius: 10,
              }
            }
            onLongPress={onLongPress}
            onClick={onClick}
            gestureRefs={gestureRefs}
          />
        </View>
      );
    }
    if (isAudio) {
      return <OdinAudio key={payload.key} fileId={fileId} payload={payload} />;
    }
    if (isLink) {
      return (
        <LinkPreviewFile
          targetDrive={targetDrive}
          fileId={fileId}
          globalTransitId={globalTransitId}
          odinId={odinId}
          payloadKey={payload.key}
          previewThumbnail={payload.previewThumbnail || previewThumbnail}
          descriptorContent={
            tryJsonParse<LinkPreviewDescriptor[]>(payload.descriptorContent as string)[0]
          }
          gestureRefs={gestureRefs}
          position={position as string}
        />
      );
    }
    if (isImage) {
      return (
        <View style={containerStyle}>
          <OdinImage
            fileId={fileId}
            fileKey={payload.key}
            targetDrive={targetDrive}
            probablyEncrypted={probablyEncrypted}
            lastModified={payload.lastModified}
            odinId={odinId}
            fit={fit}
            previewThumbnail={previewThumbnail}
            globalTransitId={globalTransitId}
            imageSize={imageSize}
            gestureRefs={gestureRefs}
            style={
              style || {
                borderRadius: 10,
              }
            }
            onLongPress={onLongPress}
            onClick={onClick}
            pendingFile={(payload as NewPayloadDescriptor)?.pendingFile as unknown as OdinBlob}
          />
        </View>
      );
    }
    if (payload.contentType && payload.contentType.startsWith('application/')) {
      return (
        <BoringFile
          file={payload}
          fileId={fileId}
          targetDrive={targetDrive}
          odinId={odinId}
          overwriteTextColor={position && position === 'right'}
        />
      );
    } else {
      console.error('Unsupported media type', payload.contentType);
    }
  }
);

const styles = StyleSheet.create({
  view: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP_SIZE,
  },
});
