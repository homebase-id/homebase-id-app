import { EmbeddedThumb, PayloadDescriptor, TargetDrive } from '@homebase-id/js-lib/core';
import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, ImageStyle, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../app/Colors';
import { Play } from '../Icons/icons';
import { OdinImage } from '../OdinImage/OdinImage';
import { useVideo } from '../../../hooks/video/useVideo';
import { useHlsManifest } from '../../../hooks/video/useHlsManifest';
import Video from 'react-native-video';
import { useDotYouClientContext } from 'feed-app-common';
import { useVideoMetadata } from '../../../hooks/video/useVideoMetadata';
import { GestureType } from 'react-native-gesture-handler';

interface VideoProps extends LocalVideoProps {
  previewThumbnail?: EmbeddedThumb;
  fit?: 'cover' | 'contain';
  preview?: boolean;
  fullscreen?: boolean;
  imageSize?: { width: number; height: number };
  onClick?: () => void;
  onLongPress?: (coords: { x: number; y: number; absoluteX: number; absoluteY: number }) => void;
  style?: ImageStyle;
  doubleTapRef?: React.RefObject<GestureType | undefined>;
  autoPlay?: boolean;
}

export const VideoWithLoader = memo(
  ({
    fileId,
    targetDrive,
    globalTransitId,
    odinId,
    previewThumbnail,
    fit = 'cover',
    preview,
    imageSize,
    onClick,
    style,
    onLongPress,
    payload,
    autoPlay,
    probablyEncrypted,
    lastModified,
    doubleTapRef,
  }: VideoProps) => {
    const [loadVideo, setLoadVideo] = useState(autoPlay);
    const doLoadVideo = useCallback(() => setLoadVideo(true), []);

    const { data: videoData } = useVideoMetadata(
      odinId,
      fileId,
      globalTransitId,
      payload.key,
      targetDrive
    ).fetchMetadata;

    if (preview) {
      return (
        <View style={style}>
          <OdinImage
            targetDrive={targetDrive}
            fileId={fileId}
            previewThumbnail={previewThumbnail}
            globalTransitId={globalTransitId}
            probablyEncrypted={probablyEncrypted}
            odinId={odinId}
            fit={fit}
            fileKey={payload.key}
            imageSize={imageSize}
            onClick={onClick}
            avoidPayload={true}
            style={style}
            onLongPress={onLongPress}
            doubleTapRef={doubleTapRef}
          />
          <View
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              zIndex: 20,
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 10,
            }}
          >
            <View
              style={{
                padding: 10,
                borderRadius: 50,
                borderWidth: 1,
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <Play size={'xl'} color={Colors.white} />
            </View>
          </View>
        </View>
      );
    }

    return (
      <>
        {loadVideo ? (
          <View
            style={{
              backgroundColor: Colors.black,
              ...imageSize,
              position: 'relative',
            }}
          >
            {videoData?.metadata.mimeType === 'application/vnd.apple.mpegurl' ? (
              <HlsVideo
                odinId={odinId}
                fileId={fileId}
                targetDrive={targetDrive}
                globalTransitId={globalTransitId}
                payload={payload}
                probablyEncrypted={probablyEncrypted}
                lastModified={lastModified}
              />
            ) : (
              <LocalVideo
                odinId={odinId}
                fileId={fileId}
                targetDrive={targetDrive}
                globalTransitId={globalTransitId}
                payload={payload}
                probablyEncrypted={probablyEncrypted}
                lastModified={lastModified}
              />
            )}
          </View>
        ) : (
          <>
            <OdinImage
              targetDrive={targetDrive}
              fileId={fileId}
              previewThumbnail={previewThumbnail}
              fit={fit}
              imageSize={imageSize}
              onClick={doLoadVideo}
              avoidPayload={true}
              style={style}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                zIndex: 20,
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.4)',
              }}
            >
              <TouchableOpacity
                onPress={doLoadVideo}
                style={{
                  padding: 20,
                  borderRadius: 50,
                  borderWidth: 1,
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <Play size={'xl'} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </>
    );
  }
);

const HlsVideo = ({ odinId, fileId, targetDrive, globalTransitId, payload }: LocalVideoProps) => {
  const dotYouClient = useDotYouClientContext();
  const { data: hlsManifest } = useHlsManifest(
    odinId,
    fileId,
    globalTransitId,
    payload.key,
    targetDrive
  ).fetch;

  if (!hlsManifest) return null;

  return (
    <Video
      source={{
        uri: hlsManifest,
        headers: dotYouClient.getHeaders(),
        type: 'm3u8',
      }}
      paused={false}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }}
      controls={true}
      resizeMode={'contain'}
      renderLoader={
        <ActivityIndicator
          size="large"
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
          }}
          color={Colors.white}
        />
      }
      onError={(e) => console.log('error', e)}
    />
  );
};

interface LocalVideoProps {
  odinId?: string;
  fileId: string;
  targetDrive: TargetDrive;
  globalTransitId?: string;
  payload: PayloadDescriptor;
  probablyEncrypted?: boolean;
  lastModified?: number;
}

const LocalVideo = ({
  odinId,
  fileId,
  targetDrive,
  globalTransitId,
  payload,
  probablyEncrypted,
  lastModified,
}: LocalVideoProps) => {
  const { data, isLoading } = useVideo({
    odinId,
    fileId,
    targetDrive,
    videoGlobalTransitId: globalTransitId,
    probablyEncrypted,
    payloadKey: payload.key,
    lastModified,
  }).fetch;

  return (
    <Video
      source={{ uri: data?.uri }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      }}
      controls={true}
      resizeMode={'contain'}
      onError={(e) => console.log('error', e)}
      renderLoader={
        <ActivityIndicator
          size="large"
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
          }}
          color={Colors.white}
        />
      }
    >
      {isLoading && (
        <ActivityIndicator
          size="large"
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 20,
          }}
          color={Colors.white}
        />
      )}
    </Video>
  );
};
