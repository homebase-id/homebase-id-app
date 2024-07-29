import {
  Dimensions,
  GestureResponderEvent,
  Image,
  ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { memo } from 'react';

import { MessageImageProps } from 'react-native-gifted-chat';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../../app/ChatStack';
import { VideoWithLoader } from '../ui/Media/VideoWithLoader';
import { OdinImage } from '../ui/OdinImage/OdinImage';

import { ChatMessageIMessage } from './ChatDetail';
import { OdinAudio } from '../ui/OdinAudio/OdinAudio';
import {
  EmbeddedThumb,
  NewPayloadDescriptor,
  PayloadDescriptor,
  TargetDrive,
} from '@youfoundation/js-lib/core';
import { StyleProp } from 'react-native';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { calculateScaledDimensions } from '../../utils/utils';
import { BoringFile } from '../ui/Media/BoringFile';
import { t } from 'feed-app-common';
import { LinkPreviewFile } from '../ui/Media/LinkPreviewFile';
import { CHAT_LINKS_PAYLOAD_KEY } from '../../provider/chat/ChatProvider';

const MediaMessage = memo(
  ({
    props,
    onLongPress,
  }: {
    props: MessageImageProps<ChatMessageIMessage>;
    onLongPress: (e: GestureResponderEvent, message: ChatMessageIMessage) => void;
  }) => {
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const { width, height } = Dimensions.get('screen');
    if (!props.currentMessage || !props.currentMessage.fileMetadata.payloads?.length) return null;
    const { currentMessage } = props;
    const payloads = currentMessage.fileMetadata.payloads;
    const isMe = currentMessage.fileMetadata.senderOdinId === '';

    const onClick = (currIndex?: number) => {
      navigation.navigate('PreviewMedia', {
        fileId: currentMessage.fileId,
        payloads: payloads,
        senderOdinId: currentMessage.fileMetadata.senderOdinId,
        createdAt: currentMessage.fileMetadata.created,
        previewThumbnail: currentMessage.fileMetadata.appData.previewThumbnail,
        currIndex: currIndex || 0,
        targetDrive: ChatDrive,
      });
    };

    if (payloads.length === 1) {
      const previewThumbnail = currentMessage.fileMetadata.appData.previewThumbnail;

      const aspectRatio =
        (previewThumbnail?.pixelWidth || 1) / (previewThumbnail?.pixelHeight || 1);

      const { width: newWidth, height: newHeight } = calculateScaledDimensions(
        previewThumbnail?.pixelWidth || 300,
        previewThumbnail?.pixelHeight || 300,
        { width: width * 0.8, height: height * 0.68 }
      );

      return (
        <InnerMediaItem
          payload={payloads[0]}
          targetDrive={ChatDrive}
          fileId={currentMessage.fileId}
          previewThumbnail={currentMessage.fileMetadata.appData.previewThumbnail}
          imageSize={{
            width: newWidth,
            height: newHeight,
          }}
          position={isMe ? 'right' : 'left'}
          fit={'contain'}
          containerStyle={props.containerStyle}
          onLongPress={(e) => onLongPress(e, currentMessage)}
          style={{
            borderRadius: 10,
            aspectRatio: aspectRatio,
          }}
          onClick={() => onClick(0)}
        />
      );
    }

    return (
      <MediaGallery
        fileId={currentMessage.fileId}
        payloads={payloads}
        targetDrive={ChatDrive}
        previewThumbnail={currentMessage.fileMetadata.appData.previewThumbnail}
        onLongPress={(e) => onLongPress(e, currentMessage)}
        onClick={(index) => onClick(index)}
      />
    );
  }
);

export const MediaGallery = ({
  fileId,
  payloads,
  previewThumbnail,
  onLongPress,
  onClick,
}: {
  fileId: string;
  onLongPress?: (e: GestureResponderEvent) => void;
  targetDrive: TargetDrive;
  previewThumbnail?: EmbeddedThumb | undefined;
  payloads: PayloadDescriptor[];
  onClick?: (currIndex: number) => void;
}) => {
  const maxVisible = 4;
  const countExcludedFromView = payloads.length - maxVisible;
  const isGallery = payloads.length >= 2;

  return (
    <View style={[styles.grid]}>
      {payloads.slice(0, maxVisible).map((item, index) => {
        return (
          <InnerMediaItem
            key={item.key || index}
            payload={item}
            fileId={fileId}
            previewThumbnail={previewThumbnail}
            targetDrive={ChatDrive}
            imageSize={{
              width: payloads.length === 3 && index === 2 ? 302 : !isGallery ? 200 : 150,
              height: !isGallery ? 200 : 150,
            }}
            containerStyle={{
              flexGrow: 1,
            }}
            style={
              isGallery
                ? {
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
                  }
                : undefined
            }
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
          onLongPress={onLongPress}
          onPress={() => onClick?.(maxVisible - 1)}
        >
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '500' }}>
            +{countExcludedFromView}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const InnerMediaItem = ({
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
}: {
  payload: PayloadDescriptor | NewPayloadDescriptor;
  containerStyle?: StyleProp<ViewStyle>;
  fileId: string;
  previewThumbnail?: EmbeddedThumb | undefined;
  targetDrive: TargetDrive;
  style?: ImageStyle;
  fit?: 'cover' | 'contain';
  position?: 'left' | 'right';
  imageSize:
    | {
        width: number;
        height: number;
      }
    | undefined;
  onLongPress: ((e: GestureResponderEvent) => void) | undefined;
  onClick: () => void;
}) => {
  const { isDarkMode } = useDarkMode();

  const isVideo = payload.contentType?.startsWith('video');
  const isAudio = payload.contentType?.startsWith('audio');
  const isImage = payload.contentType?.startsWith('image');
  const isLink = payload.key === CHAT_LINKS_PAYLOAD_KEY;

  if (!payload.contentType || !payload.key || !fileId) {
    if (isImage && (payload as NewPayloadDescriptor).pendingFile) {
      return (
        <Image
          src={((payload as NewPayloadDescriptor).pendingFile as any as OdinBlob)?.uri}
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
        payloadKey={payload.key}
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
        odinId={undefined}
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
          fit={fit}
          previewThumbnail={previewThumbnail}
          imageSize={imageSize}
          style={
            style || {
              borderRadius: 10,
            }
          }
          onLongPress={onLongPress}
          onClick={onClick}
          sharedTransitionTag={payload.key}
        />
      </View>
    );
  }
};

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

export default MediaMessage;
