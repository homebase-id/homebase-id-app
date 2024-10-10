import { EmbeddedThumb, TargetDrive } from '@homebase-id/js-lib/core';
import { memo, useMemo } from 'react';
import { ActivityIndicator, Dimensions, ImageBackground, View } from 'react-native';
import { useLinkMetadata } from '../../../hooks/links/useLinkPreview';
import { calculateScaledDimensions, openURL } from '../../../utils/utils';
import { Text } from '../Text/Text';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { ellipsisAtMaxChar } from 'homebase-id-app-common';
import { getDomainFromUrl } from '@homebase-id/js-lib/helpers';
import Animated, { runOnJS } from 'react-native-reanimated';
import { LinkPreviewDescriptor } from '@homebase-id/js-lib/media';
import { Gesture, GestureDetector, GestureType } from 'react-native-gesture-handler';

type LinkPreviewFileProps = {
  targetDrive: TargetDrive;
  globalTransitId?: string;
  fileId: string;
  odinId?: string;
  payloadKey: string;
  descriptorContent?: LinkPreviewDescriptor;
  position: string;
  previewThumbnail?: EmbeddedThumb;
  doubleTapRef?: React.RefObject<GestureType | undefined>;
};

export const LinkPreviewFile = memo(
  ({
    targetDrive,
    fileId,
    payloadKey,
    position,
    globalTransitId,
    odinId,
    previewThumbnail,
    descriptorContent,
    doubleTapRef,
  }: LinkPreviewFileProps) => {
    const { data, isLoading } = useLinkMetadata({
      targetDrive,
      fileId,
      payloadKey,
      globalTransitId,
      odinId,
    });
    const { isDarkMode } = useDarkMode();
    const hasImage = descriptorContent?.hasImage || false;
    const url = descriptorContent?.url;
    const embeddedThumbUrl = useMemo(() => {
      if (!previewThumbnail) return;
      return `data:${previewThumbnail.contentType};base64,${previewThumbnail.content}`;
    }, [previewThumbnail]);
    const tapGesture = useMemo(() => {
      const gesture = Gesture.Tap().onStart(() => {
        runOnJS(openURL)(url || data?.[0]?.url || '');
      });
      if (doubleTapRef) {
        gesture.requireExternalGestureToFail(doubleTapRef);
      }
      return gesture;
    }, [data, doubleTapRef, url]);
    if (data === null) {
      return;
    }
    const { title, description, imageUrl, imageHeight, imageWidth } = data?.[0] || {};
    const { width, height } = Dimensions.get('window');

    const { height: scaledHeight } = calculateScaledDimensions(
      previewThumbnail?.pixelWidth || imageWidth || 300,
      previewThumbnail?.pixelHeight || imageHeight || 300,
      {
        width: width * 0.8,
        height: height * 0.68,
      }
    );
    return (
      <GestureDetector gesture={tapGesture}>
        <View
          style={{
            backgroundColor: isDarkMode ? '#4646464F' : '#1A1A1A47',
            borderRadius: 15,
          }}
        >
          {hasImage && (
            <ImageBackground
              style={{
                height: scaledHeight,
              }}
              blurRadius={1}
              source={{ uri: embeddedThumbUrl }}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color={Colors.white}
                  style={{
                    alignSelf: 'center',
                    flex: 1,
                  }}
                />
              ) : (
                <Animated.Image
                  source={{ uri: imageUrl }}
                  style={{
                    // width: scaledWidth,
                    height: scaledHeight,
                  }}
                />
              )}
            </ImageBackground>
          )}
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              marginHorizontal: 10,
              marginTop: 8,
              color:
                position === 'left' ? (isDarkMode ? Colors.white : Colors.black) : Colors.white,
            }}
          >
            {ellipsisAtMaxChar(title || url, 50)}
          </Text>
          {description && (
            <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                marginHorizontal: 10,
                marginTop: 4,
                marginBottom: 10,
                color:
                  position === 'left' ? (isDarkMode ? Colors.white : Colors.black) : Colors.white,
              }}
            >
              {description}
            </Text>
          )}
          <Text
            style={{
              fontSize: 13,
              fontWeight: '500',
              marginHorizontal: 10,
              marginTop: 4,
              marginBottom: 10,
              opacity: 0.8,
              color:
                position === 'left' ? (isDarkMode ? Colors.white : Colors.black) : Colors.white,
            }}
          >
            {getDomainFromUrl(url)}
          </Text>
        </View>
      </GestureDetector>
    );
  }
);
