import { Dimensions, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { memo, useCallback, useMemo } from 'react';

import { MessageImageProps } from 'react-native-gifted-chat';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../../app/ChatStack';

import { ChatMessageIMessage } from './ChatDetail';
import { calculateScaledDimensions } from '../../utils/utils';
import { MediaGallery, MediaItem } from '../ui/Media/MediaGallery';

const MediaMessage = memo(
  ({
    props,
    onLongPress,
  }: {
    props: MessageImageProps<ChatMessageIMessage>;
    onLongPress: (e: GestureResponderEvent, message: ChatMessageIMessage) => void;
  }) => {
    const longPress = useCallback(
      (e: GestureResponderEvent, message: ChatMessageIMessage) => onLongPress?.(e, message),
      [onLongPress]
    );
    if (!props.currentMessage || !props.currentMessage.fileMetadata.payloads?.length) return null;
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
    onLongPress: (e: GestureResponderEvent, message: ChatMessageIMessage) => void;
  }) => {
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const { width, height } = Dimensions.get('screen');
    const payloads = currentMessage.fileMetadata.payloads;
    const isMe = currentMessage.fileMetadata.senderOdinId === '';

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
    const previewThumbnail = currentMessage.fileMetadata.appData.previewThumbnail;

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
      />
    );
  }
);

export default MediaMessage;
