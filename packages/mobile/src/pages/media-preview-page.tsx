import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatDrive } from '../provider/chat/ConversationProvider';
import { VideoWithLoader } from '../components/ui/Media/VideoWithLoader';

import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import Carousel from 'react-native-reanimated-carousel';
import { OdinImage } from '../components/ui/OdinImage/OdinImage';
import { ChatStackParamList } from '../app/App';
import { PayloadDescriptor } from '@youfoundation/js-lib/core';
import {
  CarouselRenderItemInfo,
  ICarouselInstance,
} from 'react-native-reanimated-carousel/lib/typescript/types';

import Share from 'react-native-share';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { Colors } from '../app/Colors';
import { useDarkMode } from '../hooks/useDarkMode';
import { AuthorName } from '../components/ui/Name';
import { HeaderTitle } from '@react-navigation/elements';
import { Text } from '../components/ui/Text/Text';
import { formatToTimeAgoWithRelativeDetail } from 'feed-app-common';
import { IconButton } from '../components/Chat/Chat-app-bar';
import { Forward, ShareNode } from '../components/ui/Icons/icons';
import Toast from 'react-native-toast-message';
import useImage from '../components/ui/OdinImage/hooks/useImage';

export type MediaProp = NativeStackScreenProps<ChatStackParamList, 'PreviewMedia'>;

export const PreviewMedia = memo((prop: MediaProp) => {
  const msg = prop.route.params.msg;
  const fileId = msg.fileId;
  const payloads = msg.fileMetadata.payloads;
  const initialIndex = prop.route.params.currIndex;

  const [currIndex, setCurrIndex] = useState(initialIndex);
  const ref = useRef<ICarouselInstance>(null);
  const { height, width } = useSafeAreaFrame();
  const { isDarkMode } = useDarkMode();
  const getImage = useImage().getFromCache;

  const headerTitle = useCallback(() => {
    return (
      <View
        style={{
          display: 'flex',
          alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
        }}
      >
        <HeaderTitle>
          <AuthorName odinId={msg.fileMetadata.senderOdinId} showYou />
        </HeaderTitle>
        <Text>{formatToTimeAgoWithRelativeDetail(new Date(msg.fileMetadata.created), true)}</Text>
      </View>
    );
  }, [msg.fileMetadata.created, msg.fileMetadata.senderOdinId]);

  useLayoutEffect(() => {
    const navigation = prop.navigation;
    navigation.setOptions({
      headerTitle: headerTitle,
    });
  }, [headerTitle, prop.navigation]);

  const onShare = useCallback(() => {
    const imageData = getImage(undefined, fileId, payloads[currIndex].key, ChatDrive);
    if (!imageData) {
      return;
    }
    Share.open({
      type: imageData.type,
      url: imageData.url,
    });
  }, [currIndex, fileId, getImage, payloads]);

  const renderItem = useCallback(
    ({ item }: CarouselRenderItemInfo<PayloadDescriptor>) => {
      const fileKey = item.key;
      const type = item.contentType;

      const isVideo = type?.startsWith('video') || false;
      return !isVideo ? (
        <OdinImage
          fileId={fileId}
          fileKey={fileKey}
          enableZoom={true}
          fit="contain"
          imageSize={{
            width: width,
            height: height,
          }}
          targetDrive={ChatDrive}
          previewThumbnail={msg.fileMetadata.appData.previewThumbnail}
        />
      ) : (
        <VideoWithLoader
          fileId={fileId}
          fileKey={fileKey}
          targetDrive={ChatDrive}
          fullscreen={true}
          previewThumbnail={msg.fileMetadata.appData.previewThumbnail}
          imageSize={{
            width: width,
            height: height,
          }}
        />
      );
    },
    [fileId, height, msg.fileMetadata.appData.previewThumbnail, width]
  );

  return (
    <>
      <Carousel
        ref={ref}
        width={width}
        height={height}
        autoPlay={false}
        data={payloads}
        scrollAnimationDuration={1000}
        onSnapToItem={(index) => {
          setCurrIndex(index);
        }}
        overscrollEnabled={false}
        windowSize={5}
        loop={false}
        defaultIndex={initialIndex}
        renderItem={renderItem}
        style={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
      />

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          padding: 5,
          right: 0,
          left: 0,
          flex: 1,
          display: 'flex',
          zIndex: 20,
          backgroundColor: isDarkMode ? '#00000060' : '#AFAFAF44',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          flexDirection: 'column',
        }}
      >
        {payloads.length > 1 && (
          <View
            style={{
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
                    preview={false}
                    onClick={() => {
                      ref.current?.scrollTo({
                        index,
                        animated: true,
                      });
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
                    ref.current?.scrollTo({
                      index,
                      animated: true,
                    });
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
        <View
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <IconButton
            icon={<ShareNode />}
            touchableProps={{
              'aria-label': 'Share',
            }}
            onPress={onShare}
          />
          <IconButton
            icon={<Forward />}
            touchableProps={{
              'aria-label': 'Forward',
            }}
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Forwarding not yet supported',
                position: 'bottom',
              });
            }}
          />
        </View>
      </View>
    </>
  );
});
