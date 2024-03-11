import { ChatMessageIMessage } from '../../../pages/chat-page';
import { StyleSheet, Text, View } from 'react-native';
import { memo } from 'react';

import { MessageImageProps } from 'react-native-gifted-chat';
import { ChatDrive } from '../../../provider/chat/ConversationProvider';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../../app/App';
import { VideoWithLoader } from '../Media/VideoWithLoader';
import { OdinImage } from '../OdinImage/OdinImage';
import { ChatMessage } from '../../../provider/chat/ChatProvider';
import { DriveSearchResult } from '@youfoundation/js-lib/core';

const ImageMessage = memo((props: MessageImageProps<ChatMessageIMessage>) => {
  if (!props.currentMessage) return null;
  return <MediaGallery msg={props.currentMessage} />;
});

const MediaGallery = ({ msg: currentMessage }: { msg: DriveSearchResult<ChatMessage> }) => {
  const payloads = currentMessage.fileMetadata.payloads;
  const maxVisible = 4;
  const countExcludedFromView = payloads.length - maxVisible;
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
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
        <View
          style={{
            width: 150,
            height: 150,
            position: 'absolute',
            bottom: 0,
            right: 0,
            borderRadius: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '500' }}>
            +{countExcludedFromView}
          </Text>
        </View>
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

export default ImageMessage;
