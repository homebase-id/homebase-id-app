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
import { NewPayloadDescriptor, PayloadDescriptor } from '@youfoundation/js-lib/core';
import { StyleProp } from 'react-native';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { calculateScaledDimensions } from '../../utils/utils';
import { BoringFile } from '../ui/Media/BoringFile';

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
          msg={currentMessage}
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
          onClick={() => {
            navigation.navigate('PreviewMedia', {
              fileId: currentMessage.fileId,
              payloadKey: payloads[0].key,
              type: payloads[0].contentType,
              msg: currentMessage,
              currIndex: 0,
            });
          }}
        />
      );
    }

    return <MediaGallery msg={props.currentMessage} onLongPress={onLongPress} />;
  }
);

const MediaGallery = ({
  msg: currentMessage,
  onLongPress,
}: {
  msg: ChatMessageIMessage;
  onLongPress: (e: GestureResponderEvent, message: ChatMessageIMessage) => void;
}) => {
  const payloads = currentMessage.fileMetadata.payloads;
  const maxVisible = 4;
  const countExcludedFromView = payloads.length - maxVisible;
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  const isGallery = payloads.length >= 2;

  return (
    <View style={[styles.grid]}>
      {payloads.slice(0, maxVisible).map((item, index) => {
        return (
          <InnerMediaItem
            key={item.key || index}
            payload={item}
            msg={currentMessage}
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
                    borderBottomLeftRadius: index === 2 ? 10 : 0,
                    borderTopRightRadius: index === 1 ? 10 : 0,
                    borderBottomRightRadius:
                      index === 3 || (payloads.length === 3 && index === 2) ? 10 : 0,
                    width: payloads.length === 3 && index === 2 ? '100%' : 150,
                  }
                : undefined
            }
            onLongPress={(e) => onLongPress(e, currentMessage)}
            onClick={() => {
              navigation.navigate('PreviewMedia', {
                fileId: currentMessage.fileId,
                payloadKey: item.key,
                type: item.contentType,
                msg: currentMessage,
                currIndex: index,
              });
            }}
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
          onLongPress={(e) => onLongPress(e, currentMessage)}
          onPress={() => {
            const item = payloads[maxVisible - 1];
            navigation.navigate('PreviewMedia', {
              fileId: currentMessage.fileId,
              payloadKey: item.key,
              type: item.contentType,
              msg: currentMessage,
              currIndex: maxVisible - 1,
            });
          }}
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
  msg,
  containerStyle,
  style,
  imageSize,
  onLongPress,
  fit,
  onClick,
  position,
}: {
  payload: PayloadDescriptor | NewPayloadDescriptor;
  msg: ChatMessageIMessage;
  containerStyle?: StyleProp<ViewStyle>;
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

  if (!payload.contentType || !payload.key || !msg.fileId) {
    if (
      payload.contentType?.startsWith('image/') &&
      (payload as NewPayloadDescriptor).pendingFile
    ) {
      return (
        <Image
          src={((payload as NewPayloadDescriptor).pendingFile as any as OdinBlob)?.uri}
          style={{ ...imageSize, ...(style || { borderRadius: 10 }) }}
        />
      );
    }
    return (
      <View
        style={{
          backgroundColor: isDarkMode ? Colors.slate[700] : Colors.slate[300],
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          ...imageSize,
          ...(style || { borderRadius: 10 }),
        }}
      >
        <Text style={{ fontSize: 48 }}>
          {payload.contentType?.startsWith('image/')
            ? '📷'
            : payload.contentType?.startsWith('audio/')
              ? '🎵'
              : payload.contentType?.startsWith('video/')
                ? '📹'
                : '📋'}
        </Text>
      </View>
    );
  }

  if (payload.contentType.startsWith('video')) {
    return (
      <View style={containerStyle}>
        <VideoWithLoader
          fileId={msg.fileId}
          fileKey={payload.key}
          targetDrive={ChatDrive}
          previewThumbnail={msg.fileMetadata.appData.previewThumbnail}
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
  if (payload.contentType.startsWith('audio/')) {
    return (
      <OdinAudio key={payload.key} fileId={msg.fileId} payload={payload as PayloadDescriptor} />
    );
  }
  if (payload.contentType.startsWith('application/')) {
    return (
      <BoringFile
        file={payload}
        fileId={msg.fileId}
        targetDrive={ChatDrive}
        odinId={undefined}
        overwriteTextColor={position && position === 'right'}
      />
    );
  } else {
    return (
      <View style={containerStyle}>
        <OdinImage
          fileId={msg.fileId}
          fileKey={payload.key}
          targetDrive={ChatDrive}
          fit={fit}
          previewThumbnail={msg.fileMetadata.appData.previewThumbnail}
          imageSize={imageSize}
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
