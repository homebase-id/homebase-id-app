import { RootStackParamList } from '../app/App';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatDrive } from '../provider/chat/ConversationProvider';
import { PhotoWithLoader } from '../components/ui/Media/PhotoWithLoader';
import { VideoWithLoader } from '../components/ui/Media/VideoWithLoader';
import { SafeAreaView } from 'react-native-safe-area-context';

export type MediaProp = NativeStackScreenProps<RootStackParamList, 'PreviewMedia'>;

export const PreviewMedia = (prop: MediaProp) => {
  const fileId = prop.route.params.fileId;
  const fileKey = prop.route.params.payloadKey;
  const type = prop.route.params.type;
  const isVideo = type?.startsWith('video') || false;

  return !isVideo ? (
    <PhotoWithLoader
      fileId={fileId}
      fileKey={fileKey}
      enableZoom={true}
      fit="cover"
      imageSize={{
        width: '100%',
        height: '100%',
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
          width: '100%',
          height: '100%',
        }}
        preview={false}
      />
    </SafeAreaView>
  );
};
