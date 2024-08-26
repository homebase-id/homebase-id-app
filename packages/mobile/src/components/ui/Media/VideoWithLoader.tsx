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
import Video from 'react-native-video';

const MAX_DOWNLOAD_SIZE = 16 * 1024 * 1024 * 1024; // 16 MB

export const VideoWithLoader = memo(
  ({
    fileId,
    targetDrive,
    previewThumbnail,
    fit = 'cover',
    preview,
    imageSize,
    onClick,
    style,
    onLongPress,
    payload,
    autoPlay,
  }: {
    fileId: string;
    targetDrive: TargetDrive;
    previewThumbnail?: EmbeddedThumb;
    fit?: 'cover' | 'contain';
    preview?: boolean;
    fullscreen?: boolean;
    imageSize?: { width: number; height: number };
    onClick?: () => void;
    onLongPress?: (e: GestureResponderEvent) => void;
    style?: ImageStyle;
    payload: PayloadDescriptor;
    autoPlay?: boolean;
  }) => {
    const [loadVideo, setLoadVideo] = useState(true);
    const doLoadVideo = useCallback(() => setLoadVideo(true), []);
    const canDownload = !preview && payload?.bytesWritten < MAX_DOWNLOAD_SIZE;
    const { data, isLoading } = useVideo({
      fileId,
      targetDrive,
      payloadKey: payload.key,
      enabled: canDownload,
    }).fetch;

    if (preview) {
      return (
        <View style={style}>
          <OdinImage
            targetDrive={targetDrive}
            fileId={fileId}
            previewThumbnail={previewThumbnail}
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
            {canDownload ? (
              <Video
                source={{ uri: data?.url }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                }}
                controls={true}
                paused={!autoPlay}
                resizeMode={'contain'}
                onEnd={() => setLoadVideo(false)}
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
            ) : (
              <OdinWebVideo targetDrive={targetDrive} fileId={fileId} fileKey={payload.key} />
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

const OdinWebVideo = ({
  fileId,
  fileKey,
}: {
  targetDrive: TargetDrive;
  fileId: string;
  fileKey: string;
}) => {
  const { authToken, getIdentity, getSharedSecret } = useAuth();
  const identity = getIdentity();

  const uri = useMemo(
    () => `https://${identity}/apps/chat/player/${fileId}/${fileKey}`,
    [fileId, fileKey, identity]
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
