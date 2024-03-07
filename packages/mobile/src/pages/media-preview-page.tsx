import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatDrive } from '../provider/chat/ConversationProvider';
import { PhotoWithLoader } from '../components/ui/Media/PhotoWithLoader';
import { VideoWithLoader } from '../components/ui/Media/VideoWithLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppStackParamList } from '../app/App';
import { Dimensions } from 'react-native';
import { useMemo } from 'react';
import Carousel from 'react-native-reanimated-carousel';

export type MediaProp = NativeStackScreenProps<AppStackParamList, 'PreviewMedia'>;

export const PreviewMedia = (prop: MediaProp) => {
  const msg = prop.route.params.msg;
  const fileId = msg.fileId;
  const payloads = msg.fileMetadata.payloads;
  const currIndex = prop.route.params.currIndex;
  const { height, width } = useMemo(() => Dimensions.get('window'), []);
  return (
    <Carousel
      width={width}
      height={height}
      autoPlay={false}
      data={payloads}
      scrollAnimationDuration={1000}
      windowSize={5}
      loop={false}
      defaultIndex={currIndex}
      renderItem={({ item }) => {
        const fileKey = item.key;
        const type = item.contentType;
        const isVideo = type?.startsWith('video') || false;
        return !isVideo ? (
          <PhotoWithLoader
            fileId={fileId}
            fileKey={fileKey}
            enableZoom={true}
            fit="contain"
            imageSize={{
              width: width,
              height: height,
            }}
            targetDrive={ChatDrive}
          />
        ) : (
          <SafeAreaView>
            <VideoWithLoader
              fileId={fileId}
              fileKey={fileKey}
              targetDrive={ChatDrive}
              fullscreen={true}
              imageSize={{
                width: width,
                height: height,
              }}
              preview={false}
            />
          </SafeAreaView>
        );
      }}
    />
  );
};
