import { ChatMessageIMessage } from '../../../pages/chat-page';
import { Pressable, StyleSheet, View } from 'react-native';

import { MessageImageProps } from 'react-native-gifted-chat';
import { ChatDrive } from '../../../provider/chat/ConversationProvider';
import { PayloadDescriptor } from '@youfoundation/js-lib/dist';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../../app/App';
import { FlatList } from 'react-native-gesture-handler';
import { VideoWithLoader } from '../Media/VideoWithLoader';
import { OdinImage } from '../OdinImage/OdinImage';

const ImageMessage = (props: MessageImageProps<ChatMessageIMessage>) => {
  const currentMessage = props.currentMessage as ChatMessageIMessage;
  const payloads: PayloadDescriptor[] = currentMessage.fileMetadata.payloads;
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  return (
    <View style={[styles.view]}>
      <FlatList
        data={payloads}
        keyExtractor={(item) => item.key}
        numColumns={payloads.length < 5 ? 2 : 3}
        renderItem={({ item }) => {
          if (item.contentType.startsWith('video')) {
            return (
              // HACK: OnPress doesn't work inside OdinImage (and IDK why), Wrapping Pressable outside for now
              <Pressable
                onPress={() => {
                  navigation.navigate('PreviewMedia', {
                    fileId: currentMessage.fileId,
                    payloadKey: item.key,
                    type: item.contentType,
                  });
                }}
              >
                <VideoWithLoader
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
                />
              </Pressable>
            );
          }
          return (
            <Pressable
              onPress={() => {
                navigation.navigate('PreviewMedia', {
                  fileId: currentMessage.fileId,
                  payloadKey: item.key,
                  type: item.contentType,
                });
              }}
            >
              <OdinImage
                fileId={currentMessage.fileId}
                fileKey={item.key}
                key={item.key}
                targetDrive={ChatDrive}
                fit="cover"
                imageSize={{
                  width: 200,
                  height: 200,
                }}
                avoidPayload={true}
                style={{
                  borderRadius: payloads.length === 1 ? 10 : 0,
                  flex: 1,
                  alignItems: 'center',
                  margin: 2,
                  width: payloads.length > 1 ? 150 : 200,
                  height: payloads.length > 1 ? 150 : 200,
                }}
                // onClick={() => {
                //   navigation.navigate('PreviewMedia', {
                //     fileId: currentMessage.fileId,
                //     payloadKey: item.key,
                //     type: item.contentType,
                //   });
                // }}
              />
            </Pressable>
          );
        }}
      />
      {/* {payloads.map((payload,index) => {
        console.log('payload', payload.thumbnails);
        return (
          <TouchableHighlight
            key={payload.key}
            onPress={() => {
              navigation.navigate('PreviewMedia', {
                fileId: currentMessage.fileId,
                payloadKey: payload.key,
              });
            }}>
            <OdinImage
              fileId={currentMessage.fileId}
              fileKey={payload.key}
              targetDrive={ChatDrive}
              fit="cover"
              avoidPayload
              imageSize={{
                width: 200,
                height: 200,
              }}
              style={{
                borderRadius: 10,
                aspectRatio: 1,
              }}
            />
          </TouchableHighlight>
        ); */}
    </View>
  );
};

const styles = StyleSheet.create({
  view: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default ImageMessage;
