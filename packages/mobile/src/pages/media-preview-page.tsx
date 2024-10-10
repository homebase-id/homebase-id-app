import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { VideoWithLoader } from '../components/ui/Media/VideoWithLoader';

import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { OdinImage } from '../components/ui/OdinImage/OdinImage';
import { ChatStackParamList } from '../app/ChatStack';
import { PayloadDescriptor } from '@homebase-id/js-lib/core';

import Share from 'react-native-share';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { Colors } from '../app/Colors';
import { AuthorName } from '../components/ui/Name';
import { HeaderTitle } from '@react-navigation/elements';
import { Text } from '../components/ui/Text/Text';
import { formatToTimeAgoWithRelativeDetail, useDotYouClientContext } from 'homebase-id-app-common';
import { Download, ShareNode } from '../components/ui/Icons/icons';

import useImage from '../components/ui/OdinImage/hooks/useImage';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import Animated from 'react-native-reanimated';
import { ZOOM_TYPE } from '@likashefqet/react-native-image-zoom';
import { CarouselRenderItemInfo } from 'react-native-reanimated-carousel/lib/typescript/types';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { FeedStackParamList } from '../app/FeedStack';
import { IconButton } from '../components/ui/Buttons';

export type MediaProp = NativeStackScreenProps<
  ChatStackParamList | FeedStackParamList,
  'PreviewMedia'
>;

export const PreviewMedia = memo(({ route, navigation }: MediaProp) => {
  const identity = useDotYouClientContext().getIdentity();
  const {
    fileId,
    globalTransitId,
    currIndex: initialIndex,
    payloads,
    senderOdinId,
    createdAt,
    previewThumbnail,
    targetDrive,
    probablyEncrypted,
    transitOdinId,
  } = route.params;
  const [currIndex, setCurrIndex] = useState(initialIndex);
  const ref = useRef<ICarouselInstance>(null);
  const { height, width } = useSafeAreaFrame();
  const { bottom: bottomInsets } = useSafeAreaInsets();
  const getImage = useImage().getFromCache;
  const [isVisible, setIsVisible] = useState(true);
  const autoplay =
    payloads.length === 1 &&
    (payloads[0].contentType?.startsWith('video') ||
      payloads[0].contentType === 'application/vnd.apple.mpegurl');

  const headerTitle = useCallback(() => {
    return (
      <Animated.View
        style={{
          display: 'flex',
          alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
        }}
      >
        {senderOdinId && senderOdinId !== identity && (
          <HeaderTitle
            style={{
              color: Colors.white,
            }}
          >
            <AuthorName odinId={senderOdinId} showYou />
          </HeaderTitle>
        )}
        {createdAt && (
          <Text
            style={{
              color: Colors.white,
            }}
          >
            {formatToTimeAgoWithRelativeDetail(new Date(createdAt), true)}
          </Text>
        )}
      </Animated.View>
    );
  }, [createdAt, senderOdinId, identity]);

  const renderDownloadButton = useCallback(() => {
    const currPayload = payloads[currIndex];
    if (
      currPayload.contentType?.startsWith('video') ||
      currPayload.contentType === 'application/vnd.apple.mpegurl'
    ) {
      return;
    }
    const onDownload = async () => {
      const imageData = getImage(
        transitOdinId,
        fileId,
        currPayload.key,
        targetDrive,
        globalTransitId,
        {
          pixelWidth: width,
          pixelHeight: height,
        }
      );

      if (!imageData || !imageData.imageData) {
        Toast.show({
          type: 'error',
          text1: 'Something went wrong while downloading image',
          position: 'bottom',
          text2: 'Click to copy the error details',
          onPress: () => {
            Clipboard.setString('No image present in the cache');
          },
        });
        return;
      }

      await CameraRoll.saveAsset(imageData.imageData?.url).catch((error) => {
        Toast.show({
          type: 'error',
          text1: 'Failed to save image',
          position: 'bottom',
          text2: error.message,
        });
      });

      Toast.show({
        type: 'success',
        text1: 'Image downloaded successfully',
        position: 'bottom',
      });
    };
    return <IconButton icon={<Download color={Colors.white} />} onPress={onDownload} />;
  }, [
    currIndex,
    fileId,
    getImage,
    globalTransitId,
    height,
    payloads,
    targetDrive,
    transitOdinId,
    width,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: headerTitle,
      headerShown: isVisible,
      headerRight: renderDownloadButton,
      headerTintColor: Colors.white,
      headerStyle: {
        backgroundColor: Platform.OS === 'android' ? Colors.black : 'transparent',
      },
    });
  }, [headerTitle, isVisible, navigation, renderDownloadButton]);

  const onShare = useCallback(() => {
    const imageData = getImage(
      transitOdinId,
      fileId,
      payloads[currIndex].key,
      targetDrive,
      globalTransitId,
      {
        pixelWidth: width,
        pixelHeight: height,
      }
    );
    if (!imageData) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong while sharing image',
        position: 'bottom',
        text2: 'Click to copy the error details',
        onPress: () => {
          Clipboard.setString('No image present in the cache');
        },
      });
      return;
    }
    Share.open({
      type: imageData?.imageData?.type,
      url: imageData?.imageData?.url,
    });
  }, [
    currIndex,
    fileId,
    getImage,
    globalTransitId,
    height,
    payloads,
    targetDrive,
    transitOdinId,
    width,
  ]);

  const renderItem = useCallback(
    ({ item }: CarouselRenderItemInfo<PayloadDescriptor>) => {
      const fileKey = item.key;
      const type = item.contentType;

      const isVideo =
        type?.startsWith('video') || type === 'application/vnd.apple.mpegurl' || false;
      return !isVideo ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: Colors.black,
          }}
        >
          <OdinImage
            fileId={fileId}
            fileKey={fileKey}
            globalTransitId={globalTransitId}
            probablyEncrypted={probablyEncrypted}
            odinId={transitOdinId}
            enableZoom={true}
            fit="contain"
            imageSize={{
              width: width,
              height: height,
            }}
            targetDrive={targetDrive}
            previewThumbnail={item.previewThumbnail || previewThumbnail}
            imageZoomProps={{
              isSingleTapEnabled: true,
              minPanPointers: 1,
              onSingleTap: () => {
                setIsVisible(!isVisible);
              },
              onDoubleTap: (type) => {
                if (type === ZOOM_TYPE.ZOOM_IN) {
                  setIsVisible(false);
                }
              },
              onPinchStart: () => {
                setIsVisible(false);
              },
              onResetAnimationEnd: (finished) => {
                if (finished) setIsVisible(true);
              },
              isPanEnabled: !isVisible,
            }}
          />
        </View>
      ) : (
        <VideoWithLoader
          fileId={fileId}
          payload={item}
          targetDrive={targetDrive}
          fullscreen={true}
          previewThumbnail={previewThumbnail}
          odinId={transitOdinId}
          globalTransitId={globalTransitId}
          probablyEncrypted={probablyEncrypted}
          autoPlay={autoplay}
          imageSize={{
            width: width,
            height: height,
          }}
        />
      );
    },
    [
      autoplay,
      fileId,
      globalTransitId,
      height,
      isVisible,
      previewThumbnail,
      probablyEncrypted,
      targetDrive,
      transitOdinId,
      width,
    ]
  );

  const hasVideoPayload = payloads.some(
    (item) =>
      item.contentType?.startsWith('video') || item.contentType === 'application/vnd.apple.mpegurl'
  );

  return (
    <BottomSheetModalProvider>
      <Carousel
        ref={ref}
        width={width}
        height={height}
        autoPlay={false}
        data={payloads}
        enabled={payloads?.length > 1 && isVisible}
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
          backgroundColor: Colors.pink[100],
        }}
      />

      {isVisible && (
        <View
          style={{
            position: 'absolute',
            bottom: bottomInsets,
            padding: 5,
            right: 0,
            left: 0,

            zIndex: 20,
            backgroundColor: '',
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
                if (
                  item.contentType.startsWith('video') ||
                  item.contentType === 'application/vnd.apple.mpegurl'
                ) {
                  return (
                    <VideoWithLoader
                      key={index}
                      fileId={fileId}
                      payload={item}
                      targetDrive={targetDrive}
                      previewThumbnail={payloads.length === 1 ? previewThumbnail : undefined}
                      globalTransitId={globalTransitId}
                      probablyEncrypted={probablyEncrypted}
                      odinId={transitOdinId}
                      lastModified={item.lastModified}
                      fit="cover"
                      imageSize={{
                        width: 50,
                        height: 50,
                      }}
                      style={{
                        borderRadius: 10,
                        opacity: index === currIndex ? 0.2 : 1,
                      }}
                      preview={true}
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
                    fileId={fileId}
                    fileKey={item.key}
                    key={item.key}
                    targetDrive={targetDrive}
                    globalTransitId={globalTransitId}
                    probablyEncrypted={probablyEncrypted}
                    previewThumbnail={item.previewThumbnail}
                    odinId={transitOdinId}
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

          {!hasVideoPayload && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <IconButton
                icon={<ShareNode color={Colors.white} />}
                touchableProps={{
                  'aria-label': 'Share',
                }}
                onPress={onShare}
              />
            </View>
          )}
        </View>
      )}
    </BottomSheetModalProvider>
  );
});
