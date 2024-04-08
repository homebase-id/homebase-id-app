import { Pressable, StyleSheet, Text, View } from 'react-native';
import { memo } from 'react';

import { MessageImageProps } from 'react-native-gifted-chat';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../../app/App';
import { VideoWithLoader } from '../ui/Media/VideoWithLoader';
import { OdinImage } from '../ui/OdinImage/OdinImage';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { ChatMessageIMessage } from './ChatDetail';
import { OdinAudio } from '../ui/OdinAudio/OdinAudio';

const MediaMessage = memo((props: MessageImageProps<ChatMessageIMessage>) => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  if (!props.currentMessage) return null;
  const { currentMessage } = props;
  const payloads = currentMessage.fileMetadata.payloads;

  if (payloads.length === 1) {
    const aspectRatio =
      (currentMessage.fileMetadata.appData.previewThumbnail?.pixelWidth || 1) /
        (currentMessage.fileMetadata.appData.previewThumbnail?.pixelHeight || 1) >
      1.33
        ? 19 / 18
        : 18 / 19 || 1;
    if (payloads[0].contentType.startsWith('video')) {
      return (
        <VideoWithLoader
          fileId={currentMessage.fileId}
          fileKey={payloads[0].key}
          targetDrive={ChatDrive}
          previewThumbnail={currentMessage.fileMetadata.appData.previewThumbnail}
          fit="cover"
          imageSize={{
            width: 200,
            height: 200,
          }}
          preview={true}
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
    if (payloads[0].contentType.startsWith('audio/')) {
      return (
        <OdinAudio key={payloads[0].key} fileId={currentMessage.fileId} payload={payloads[0]} />
      );
    } else {
      return (
        <View style={props.containerStyle}>
          <OdinImage
            fileId={currentMessage.fileId}
            fileKey={payloads[0].key}
            targetDrive={ChatDrive}
            fit="cover"
            previewThumbnail={currentMessage.fileMetadata.appData.previewThumbnail}
            // imageSize={{
            //   width: 200,
            //   height: 200,
            // }}
            style={{
              borderRadius: 10,
              aspectRatio: aspectRatio,
              minWidth: 200,
              minHeight: 200,
              width: '100%',
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
        </View>
      );
    }
  }

  return <MediaGallery msg={props.currentMessage} />;
});

const MediaGallery = ({ msg: currentMessage }: { msg: HomebaseFile<ChatMessage> }) => {
  const payloads = currentMessage.fileMetadata.payloads;
  const maxVisible = 4;
  const countExcludedFromView = payloads.length - maxVisible;
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  const isGallery = payloads.length >= 2;

  return (
    <View style={styles.grid}>
      {payloads.slice(0, maxVisible).map((item, index) => {
        if (item.contentType.startsWith('video')) {
          return (
            <VideoWithLoader
              key={index}
              fileId={currentMessage.fileId}
              fileKey={item.key}
              targetDrive={ChatDrive}
              previewThumbnail={
                payloads.length === 1
                  ? currentMessage.fileMetadata.appData.previewThumbnail
                  : undefined
              }
              fit="cover"
              imageSize={{
                width: 200,
                height: 200,
              }}
              preview={true}
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
        }
        if (item.contentType.startsWith('audio/')) {
          return <OdinAudio key={item.key} fileId={currentMessage.fileId} payload={item} />;
        }
        return (
          <OdinImage
            fileId={currentMessage.fileId}
            fileKey={item.key}
            key={item.key}
            targetDrive={ChatDrive}
            fit="cover"
            previewThumbnail={currentMessage.fileMetadata.appData.previewThumbnail}
            imageSize={{
              width: !isGallery ? 200 : 150,
              height: !isGallery ? 200 : 150,
            }}
            avoidPayload={true}
            style={
              !isGallery
                ? {
                    borderRadius: 10,
                  }
                : {
                    borderTopLeftRadius: index === 0 ? 10 : 0,
                    borderBottomLeftRadius: index === 2 ? 10 : 0,
                    borderTopRightRadius: index === 1 ? 10 : 0,
                    borderBottomRightRadius: index === 3 ? 10 : 0,
                    margin: 1,
                    aspectRatio: payloads.length === 3 && index === 2 ? 1 : undefined,
                    width: payloads.length === 3 && index === 2 ? '100%' : 150,
                  }
            }
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
            // borderRadius: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
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

const styles = StyleSheet.create({
  view: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default MediaMessage;
