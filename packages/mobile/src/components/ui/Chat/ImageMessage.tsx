import { ChatMessageIMessage } from '../../../pages/chat-page';
import { Pressable, StyleSheet, View } from 'react-native';

import { IMessage, MessageImageProps } from 'react-native-gifted-chat';
import { ChatDrive } from '../../../provider/chat/ConversationProvider';
import { PayloadDescriptor } from '@youfoundation/js-lib/dist';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../app/App';
import { FlatList } from 'react-native-gesture-handler';
import { OdinImage } from '../Media/PhotoWithLoader';
import { VideoWithLoader } from '../Media/VideoWithLoader';

const ImageMessage = (props: MessageImageProps<IMessage>) => {
  const currentMessage = props.currentMessage as ChatMessageIMessage;
  const payloads: PayloadDescriptor[] = currentMessage.fileMetadata.payloads;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.view]}>
      <FlatList
        data={payloads}
        keyExtractor={item => item.key}
        numColumns={2}
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
                }}>
                <VideoWithLoader
                  fileId={currentMessage.fileId}
                  fileKey={item.key}
                  targetDrive={ChatDrive}
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
              }}>
              <OdinImage
                fileId={currentMessage.fileId}
                fileKey={item.key}
                // enableZoom={false}
                key={item.key}
                targetDrive={ChatDrive}
                fit="cover"
                imageSize={{
                  width: 200,
                  height: 200,
                }}
                avoidPayload={true}
                // style={{
                //   borderRadius: 10,
                //   flex: 1,
                //   alignItems: 'stretch',
                // }}
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
              probablyEncrypted
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
