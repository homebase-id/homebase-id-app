import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatDrive } from '../provider/chat/ConversationProvider';
import { PhotoWithLoader } from '../components/ui/Media/PhotoWithLoader';
import { VideoWithLoader } from '../components/ui/Media/VideoWithLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppStackParamList } from '../app/App';
import { Dimensions, View } from 'react-native';
import { useMemo, useState } from 'react';
import Carousel from 'react-native-reanimated-carousel';
import { OdinImage } from '../components/ui/OdinImage/OdinImage';
import { useDarkMode } from '../hooks/useDarkMode';
import { Colors } from '../app/Colors';

export type MediaProp = NativeStackScreenProps<AppStackParamList, 'PreviewMedia'>;

export const PreviewMedia = (prop: MediaProp) => {
  const msg = prop.route.params.msg;
  const fileId = msg.fileId;
  const payloads = msg.fileMetadata.payloads;
  const [initialIndex, setInitialIndex] = useState(prop.route.params.currIndex);
  const [currIndex, setCurrIndex] = useState(initialIndex);
  const { height, width } = useMemo(() => Dimensions.get('window'), []);
  const { isDarkMode } = useDarkMode();

  return (
    <>
      <Carousel
        width={width}
        height={height}
        autoPlay={false}
        data={payloads}
        scrollAnimationDuration={1000}
        windowSize={5}
        loop={false}
        defaultIndex={initialIndex}
        onSnapToItem={(index) => {
          setCurrIndex(index);
        }}
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
      {payloads.length > 1 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            padding: 5,
            flex: 1,
            right: 0,
            left: 0,
            backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[200],
            flexDirection: 'row',
            alignSelf: 'center',
            gap: 2,
          }}
        >
          {payloads.map((item, index) => {
            if (item.contentType.startsWith('video')) {
              return (
                <VideoWithLoader
                  key={index}
                  fileId={msg.fileId}
                  fileKey={item.key}
                  targetDrive={ChatDrive}
                  previewThumbnail={
                    payloads.length === 1 ? msg.fileMetadata.appData.previewThumbnail : undefined
                  }
                  fit="cover"
                  imageSize={{
                    width: 200,
                    height: 200,
                  }}
                  preview={true}
                  onClick={() => {
                    setInitialIndex(index);
                    setCurrIndex(index);
                  }}
                />
              );
            }
            return (
              <OdinImage
                fileId={msg.fileId}
                fileKey={item.key}
                key={item.key}
                targetDrive={ChatDrive}
                fit="cover"
                imageSize={{
                  width: 50,
                  height: 50,
                }}
                avoidPayload={true}
                onClick={() => {
                  setInitialIndex(index);
                  setCurrIndex(index);
                }}
                style={{
                  borderRadius: 10,
                  opacity: index === currIndex ? 0.2 : 1,
                }}
              />
            );
          })}
        </View>
      )}
    </>
  );
};
