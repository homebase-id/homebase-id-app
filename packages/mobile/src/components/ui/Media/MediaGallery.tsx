import { Image, ImageStyle, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
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
import { t } from 'feed-app-common';
import { VideoWithLoader } from './VideoWithLoader';
import { OdinAudio } from '../OdinAudio/OdinAudio';
import { LinkPreviewFile } from './LinkPreviewFile';
import { POST_LINKS_PAYLOAD_KEY } from '@homebase-id/js-lib/public';
import { Colors } from '../../../app/Colors';
import { memo } from 'react';
import { LinkPreviewDescriptor } from '@homebase-id/js-lib/media';
import { tryJsonParse } from '@homebase-id/js-lib/helpers';
import { GestureType } from 'react-native-gesture-handler';

export const MediaGallery = memo(
  ({
    fileId,
    payloads,
    onLongPress,
    onClick,
    targetDrive,
    probablyEncrypted,
    odinId,
    globalTransitId,
    style,
    doubleTapRef,
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
    doubleTapRef?: React.RefObject<GestureType | undefined>;
  }) => {
    const maxVisible = 4;
    const countExcludedFromView = payloads?.length - maxVisible;
    return (
      <View style={[styles.grid, style]}>
        {payloads.slice(0, maxVisible).map((item, index) => {
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
              doubleTapRef={doubleTapRef}
              imageSize={{
                width: payloads.length === 3 && index === 2 ? 302 : 150,
                height: 150,
              }}
              containerStyle={{
                flexGrow: 1,
              }}
              style={{
                borderTopLeftRadius: index === 0 ? 10 : 0,
                borderBottomLeftRadius:
                  index === 2 || (index === 0 && payloads.length === 2) ? 10 : 0,
                borderTopRightRadius: index === 1 ? 10 : 0,
                borderBottomRightRadius:
                  index === 3 ||
                  (payloads.length === 3 && index === 2) ||
                  (index === 1 && payloads.length === 2)
                    ? 10
                    : 0,
                width: payloads.length === 3 && index === 2 ? '100%' : 150,
              }}
              onLongPress={onLongPress}
              onClick={() => onClick?.(index)}
            />
          );
        })}
        {countExcludedFromView > 0 && (
          <Pressable
            style={{
              width: 150,
              height: 150,
              position: 'absolute',
              bottom: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: 'rgba(0,0,0,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
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
    doubleTapRef,
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
    doubleTapRef?: React.RefObject<GestureType | undefined>;
  }) => {
    const { isDarkMode } = useDarkMode();

    const isVideo =
      payload.contentType?.startsWith('video') ||
      payload.contentType === 'application/vnd.apple.mpegurl';
    const isAudio = payload.contentType?.startsWith('audio');
    const isImage = payload.contentType?.startsWith('image');
    const isLink = payload.key === CHAT_LINKS_PAYLOAD_KEY || payload.key === POST_LINKS_PAYLOAD_KEY;
    if (!payload.contentType || !payload.key || !fileId) {
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
          <Text style={{ fontSize: 48 }}>
            {isImage ? '📷' : isAudio ? '🎵' : isVideo ? '📹' : '📋'}
          </Text>
          {(payload as NewPayloadDescriptor).uploadProgress ? (
            <Text style={{ fontSize: 14 }}>
              {t((payload as NewPayloadDescriptor).uploadProgress?.phase)}{' '}
              {progressPercentage !== 0 ? `${progressPercentage}%` : ''}
            </Text>
          ) : null}
        </View>
      );
    }

    if (isVideo) {
      return (
        <View style={containerStyle}>
          <VideoWithLoader
            fileId={fileId}
            payload={payload as PayloadDescriptor}
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
            doubleTapRef={doubleTapRef}
          />
        </View>
      );
    }
    if (isAudio) {
      return <OdinAudio key={payload.key} fileId={fileId} payload={payload as PayloadDescriptor} />;
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
          doubleTapRef={doubleTapRef}
          position={position as string}
        />
      );
    }
    if (payload.contentType.startsWith('application/')) {
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
            doubleTapRef={doubleTapRef}
            style={
              style || {
                borderRadius: 10,
              }
            }
            onLongPress={onLongPress}
            onClick={onClick}
          />
        </View>
      );
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
    gap: 2,
    width: 302,
  },
});
