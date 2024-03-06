import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatDrive } from '../provider/chat/ConversationProvider';
import { PhotoWithLoader } from '../components/ui/Media/PhotoWithLoader';
import { VideoWithLoader } from '../components/ui/Media/VideoWithLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppStackParamList } from '../app/App';
import { Dimensions } from 'react-native';

export type MediaProp = NativeStackScreenProps<AppStackParamList, 'PreviewMedia'>;

export const PreviewMedia = (prop: MediaProp) => {
  const fileId = prop.route.params.fileId;
  const fileKey = prop.route.params.payloadKey;
  const type = prop.route.params.type;
  const previewThumbnail = prop.route.params.previewThumbnail;
  const isVideo = type?.startsWith('video') || false;
  const { height, width } = Dimensions.get('window');
  return !isVideo ? (
    <PhotoWithLoader
      fileId={fileId}
      fileKey={fileKey}
      enableZoom={true}
      previewThumbnail={previewThumbnail}
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
        previewThumbnail={previewThumbnail}
        fullscreen={true}
        imageSize={{
          width: width,
          height: height,
        }}
        preview={false}
      />
    </SafeAreaView>
  );
};
