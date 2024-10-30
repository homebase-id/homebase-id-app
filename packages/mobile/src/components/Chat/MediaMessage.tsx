import { Dimensions, StyleProp, ViewStyle } from 'react-native';
import { memo, useCallback, useMemo } from 'react';

import { MessageImageProps } from 'react-native-gifted-chat';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../../app/ChatStack';

import { ChatMessageIMessage } from './ChatDetail';
import { calculateScaledDimensions } from '../../utils/utils';
import { MediaGallery, MediaItem } from '../ui/Media/MediaGallery';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { useDotYouClientContext } from 'homebase-id-app-common';
import { DEFAULT_PAYLOAD_KEY } from '@homebase-id/js-lib/core';

const MediaMessage = memo(
  ({
    props,
    onLongPress,
  }: {
    props: MessageImageProps<ChatMessageIMessage>;
    onLongPress: (
      coords: {
        x: number;
        y: number;
        absoluteX: number;
        absoluteY: number;
      },
      message: ChatMessageIMessage
    ) => void;
  }) => {
    const longPress = useCallback(
      (
        coords: {
          x: number;
          y: number;
          absoluteX: number;
          absoluteY: number;
        },
        message: ChatMessageIMessage
      ) => onLongPress?.(coords, message),
      [onLongPress]
    );
    if (
      !props.currentMessage ||
      !props.currentMessage.fileMetadata.payloads?.filter((p) => p.key !== DEFAULT_PAYLOAD_KEY)
        .length
    ) {
      return null;
    }
    return (
      <InnerMediaMessage
        currentMessage={props.currentMessage}
        containerStyle={props.containerStyle}
        onLongPress={longPress}
      />
    );
  }
);

const InnerMediaMessage = memo(
  ({
    currentMessage,
    containerStyle,
    onLongPress,
  }: {
    currentMessage: ChatMessageIMessage;
    containerStyle?: StyleProp<ViewStyle>;
    onLongPress: (
      coords: {
        x: number;
        y: number;
        absoluteX: number;
        absoluteY: number;
      },
      message: ChatMessageIMessage
    ) => void;
  }) => {
    const { isDarkMode } = useDarkMode();
    const identity = useDotYouClientContext().getIdentity();
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const { width, height } = Dimensions.get('screen');

    const payloads = currentMessage.fileMetadata.payloads?.filter(
      (p) => p.key !== DEFAULT_PAYLOAD_KEY
    );
    const isMe =
      !currentMessage.fileMetadata.senderOdinId ||
      currentMessage.fileMetadata.senderOdinId === identity;

    const onClick = useCallback(
      (currIndex?: number) => {
        navigation.navigate('PreviewMedia', {
          fileId: currentMessage.fileId,
          payloads: payloads,
          senderOdinId: currentMessage.fileMetadata.senderOdinId,
          createdAt: currentMessage.fileMetadata.created,
          previewThumbnail: currentMessage.fileMetadata.appData.previewThumbnail,
          currIndex: currIndex || 0,
          targetDrive: ChatDrive,
        });
      },
      [currentMessage, navigation, payloads]
    );
    const previewThumbnail =
      (payloads.length === 1 ? payloads[0]?.previewThumbnail : undefined) ||
      currentMessage.fileMetadata.appData.previewThumbnail;

    const aspectRatio = useMemo(
      () => (previewThumbnail?.pixelWidth || 1) / (previewThumbnail?.pixelHeight || 1),
      [previewThumbnail]
    );

    const { width: newWidth, height: newHeight } = useMemo(
      () =>
        calculateScaledDimensions(
          previewThumbnail?.pixelWidth || 300,
          previewThumbnail?.pixelHeight || 300,
          { width: width * 0.8, height: height * 0.68 }
        ),
      [previewThumbnail, width, height]
    );

    if (payloads.length === 1) {
      return (
        <MediaItem
          key={`${currentMessage.fileMetadata.appData.content}_${payloads[0].key}`}
          payload={payloads[0]}
          targetDrive={ChatDrive}
          fileId={currentMessage.fileId}
          previewThumbnail={
            payloads[0]?.previewThumbnail || currentMessage.fileMetadata.appData.previewThumbnail
          }
          imageSize={{
            width: newWidth,
            height: newHeight,
          }}
          position={isMe ? 'right' : 'left'}
          fit={'contain'}
          containerStyle={containerStyle}
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
        style={{
          borderRadius: 10,
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
          maxWidth: width * 0.8,
        }}
      />
    );
  }
);

export default MediaMessage;
