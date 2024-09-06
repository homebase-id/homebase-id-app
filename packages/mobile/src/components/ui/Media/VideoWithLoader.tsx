import { EmbeddedThumb, PayloadDescriptor, TargetDrive } from '@homebase-id/js-lib/core';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  ImageStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../app/Colors';
import WebView from 'react-native-webview';
import { TouchableWithoutFeedback } from 'react-native';
import { useAuth } from '../../../hooks/auth/useAuth';
import { uint8ArrayToBase64 } from '@homebase-id/js-lib/helpers';
import { Play } from '../Icons/icons';
import { OdinImage } from '../OdinImage/OdinImage';
import { useVideo } from '../../../hooks/video/useVideo';
import { useHlsManifest } from '../../../hooks/video/useHlsManifest';
import Video from 'react-native-video';
import { useDotYouClientContext } from 'feed-app-common';
import { useVideoMetadata } from '../../../hooks/video/useVideoMetadata';

const MAX_DOWNLOAD_SIZE = 16 * 1024 * 1024 * 1024; // 16 MB

interface VideoProps extends OdinWebVideoProps, LocalVideoProps {
  previewThumbnail?: EmbeddedThumb;
  fit?: 'cover' | 'contain';
  preview?: boolean;
  fullscreen?: boolean;
  imageSize?: { width: number; height: number };
  onClick?: () => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  style?: ImageStyle;

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
  }: VideoProps) => {
    const [loadVideo, setLoadVideo] = useState(autoPlay);
    const doLoadVideo = useCallback(() => setLoadVideo(true), []);
    const canDownload = !preview && payload?.bytesWritten < MAX_DOWNLOAD_SIZE;

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
            ) : canDownload ? (
              <LocalVideo
                fileId={fileId}
                targetDrive={targetDrive}
                globalTransitId={globalTransitId}
                payload={payload}
                probablyEncrypted={probablyEncrypted}
                lastModified={lastModified}
              />
            ) : (
              <OdinWebVideo targetDrive={targetDrive} fileId={fileId} payload={payload} />
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

interface OdinWebVideoProps {
  targetDrive: TargetDrive;
  fileId: string;
  payload: PayloadDescriptor;
}

const OdinWebVideo = ({ fileId, payload }: OdinWebVideoProps) => {
  const { authToken, getIdentity, getSharedSecret } = useAuth();
  const identity = getIdentity();

  const uri = useMemo(
    () => `https://${identity}/apps/chat/player/${fileId}/${payload.key}`,
    [fileId, payload, identity]
  );

  const sharedSecret = getSharedSecret();
  const base64SharedSecret = sharedSecret ? uint8ArrayToBase64(sharedSecret) : '';

  const INJECTED_JAVASCRIPT = `(function() {
    const APP_SHARED_SECRET_KEY = 'APPS_chat';
    const APP_AUTH_TOKEN_KEY = 'BX0900_chat';
    const IDENTITY_KEY = 'identity';
    const APP_CLIENT_TYPE_KEY = 'client_type';

    const APP_SHARED_SECRET = '${base64SharedSecret}';
    const APP_AUTH_TOKEN = '${authToken}';
    const IDENTITY = '${identity}';
    const APP_CLIENT_TYPE = 'react-native';

    window.localStorage.setItem(APP_SHARED_SECRET_KEY, APP_SHARED_SECRET);
    window.localStorage.setItem(APP_AUTH_TOKEN_KEY, APP_AUTH_TOKEN);
    window.localStorage.setItem(IDENTITY_KEY, IDENTITY);
    window.localStorage.setItem(APP_CLIENT_TYPE_KEY, APP_CLIENT_TYPE);
  })();`;

  if (identity && uri) {
    return (
      <TouchableWithoutFeedback>
        <WebView
          source={{
            uri,
          }}
          mixedContentMode="always"
          javaScriptEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            backgroundColor: Colors.black,
          }}
          allowsInlineMediaPlayback={true}
          allowsProtectedMedia={true}
          allowsAirPlayForMediaPlayback={true}
          allowsFullscreenVideo={true}
          onError={(syntheticEvent) => {
            console.log('onerror');
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          onMessage={(_data) => console.log(_data.nativeEvent.data)}
        />
      </TouchableWithoutFeedback>
    );
  } else return null;
};
