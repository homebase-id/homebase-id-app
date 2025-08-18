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
import { useAuth } from '../../hooks/auth/useAuth';
import { DEFAULT_PAYLOAD_KEY, ImageSize, PayloadDescriptor } from '@homebase-id/js-lib/core';
import { ChatDeletedArchivalStaus } from '../../provider/chat/ChatProvider';
import useImage from '../ui/OdinImage/hooks/useImage';

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
      !props.currentMessage.fileMetadata.payloads ||
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
    const identity = useAuth().getIdentity();
    const { isDarkMode } = useDarkMode();
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const { width, height } = Dimensions.get('screen');

    const hasText = !!currentMessage.text;

    const payloads = currentMessage.fileMetadata.payloads?.filter(
      (p) => p.key !== DEFAULT_PAYLOAD_KEY
    );
    const isMe =
      !currentMessage.fileMetadata.senderOdinId ||
      currentMessage.fileMetadata.senderOdinId === identity;

    const previewThumbnail =
      (payloads && payloads.length === 1 ? payloads[0]?.previewThumbnail : undefined) ||
      currentMessage.fileMetadata.appData.previewThumbnail;

    const { width: newWidth, height: newHeight } = useMemo(
      () =>
        calculateScaledDimensions(
          previewThumbnail?.pixelWidth || 300,
          previewThumbnail?.pixelHeight || 300,
          { width: width * 0.8, height: height * 0.68 }
        ),
      [previewThumbnail, width, height]
    );
    
    const roundedWidth = Math.round(newWidth);
    const roundedHeight = Math.round(newHeight);


    // console.log(`InnerMediaMessage: Calculated rounded dimensions - width: ${roundedWidth}, height: ${roundedHeight}`);

    // Near the top, after calculating roundedWidth/roundedHeight
    const selectedPayload = payloads?.[0]; // Default to first; for multi, see note below

    const isThumbless = ['image/svg+xml', 'image/gif'].includes(selectedPayload?.contentType!);
    const mediumSize: ImageSize | undefined = isThumbless ? undefined : { pixelWidth: roundedWidth, pixelHeight: roundedHeight };

    // const mediumSize: ImageSize = { pixelWidth: roundedWidth, pixelHeight: roundedHeight };

    const { fetch: { data: cachedImageData } } = useImage({
        odinId: currentMessage.fileMetadata.senderOdinId,
        imageFileId: currentMessage.fileId,
        imageFileKey: selectedPayload?.key,
        imageGlobalTransitId: currentMessage.fileMetadata.globalTransitId,
        imageDrive: ChatDrive,
        probablyEncrypted: currentMessage.fileMetadata.isEncrypted || false, // Adjust based on your message data; default to false if unknown
        size: mediumSize,
        lastModified: selectedPayload?.lastModified || currentMessage.fileMetadata.updated || undefined, // Use available timestamp
        systemFileType: currentMessage.fileSystemType || undefined, // If present in message
    });

    const onClick = useCallback(
    (currIndex?: number) => {
        if (!payloads) return;
        const selectedPayload = payloads[currIndex || 0];
        // For multi-payload, you'd use cachedImageData[currIndex] if pre-fetched in an array (see below)
        const fallbackThumb = selectedPayload.previewThumbnail
        ? `data:${selectedPayload.previewThumbnail.contentType};base64,${selectedPayload.previewThumbnail.content}`
        : undefined;
        const cachedUrl = cachedImageData?.url || fallbackThumb;
        // console.log(`onClick: Using cachedUrl: ${cachedUrl || 'fallback thumb'}`); // Temp log for verification
        navigation.navigate('PreviewMedia', {
          fileId: currentMessage.fileId,
          payloads: payloads,
          senderOdinId: currentMessage.fileMetadata.senderOdinId,
          createdAt: currentMessage.fileMetadata.created,
          previewThumbnail: currentMessage.fileMetadata.appData.previewThumbnail,
          currIndex: currIndex || 0,
          targetDrive: ChatDrive,
          cachedUrl,
        });
    },
    [currentMessage, navigation, payloads, cachedImageData] // Add cachedImageData to deps
    );
    const aspectRatio = useMemo(
      () => (previewThumbnail?.pixelWidth || 1) / (previewThumbnail?.pixelHeight || 1),
      [previewThumbnail]
    );

    if (currentMessage.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus) {
      return null;
    }

    if (payloads?.length === 1) {
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
            width: roundedWidth,
            height: roundedHeight,
          }}
          position={isMe ? 'right' : 'left'}
          fit={'contain'}
          containerStyle={containerStyle}
          onLongPress={(e) => onLongPress(e, currentMessage)}
          style={{
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderBottomLeftRadius: hasText ? 0 : 10,
            borderBottomRightRadius: hasText ? 0 : 10,
            aspectRatio: aspectRatio,
          }}
          onClick={() => onClick(0)}
        />
      );
    }

    return (
      <MediaGallery
        fileId={currentMessage.fileId}
        payloads={payloads as PayloadDescriptor[]}
        targetDrive={ChatDrive}
        previewThumbnail={currentMessage.fileMetadata.appData.previewThumbnail}
        onLongPress={(e) => onLongPress(e, currentMessage)}
        onClick={(index) => onClick(index)}
        hasText={hasText}
        style={{
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderBottomLeftRadius: hasText ? 0 : 10,
          borderBottomRightRadius: hasText ? 0 : 10,
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
          maxWidth: width * 0.8,
        }}
      />
    );
  }
);

export default MediaMessage;
