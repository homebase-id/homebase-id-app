import { TargetDrive } from '@homebase-id/js-lib/core';
import { memo } from 'react';
import { Dimensions, Image, Pressable } from 'react-native';
import { useLinkMetadata } from '../../../hooks/links/useLinkPreview';
import { calculateScaledDimensions, openURL } from '../../../utils/utils';
import { Text } from '../Text/Text';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { ellipsisAtMaxChar } from 'feed-app-common';
import { getDomainFromUrl, getHostFromUrl } from '@homebase-id/js-lib/helpers';

type LinkPreviewFileProps = {
  targetDrive: TargetDrive;
  fileId: string;
  globalTransitId?: string;
  odinId?: string;
  payloadKey: string;
  position: string;
};

export const LinkPreviewFile = memo(
  ({
    targetDrive,
    fileId,
    payloadKey,
    position,
    globalTransitId,
    odinId,
  }: LinkPreviewFileProps) => {
    const { data } = useLinkMetadata({ targetDrive, fileId, payloadKey, globalTransitId, odinId });
    const { isDarkMode } = useDarkMode();

    if (!data || !data.length) {
      return null;
    }
    const { title, description, imageUrl, imageHeight, imageWidth, url } = data[0];
    const { width, height } = Dimensions.get('window');
    const { height: scaledHeight } = calculateScaledDimensions(
      imageWidth || 300,
      imageHeight || 300,
      {
        width: width * 0.8,
        height: height * 0.68,
      }
    );
    return (
      <Pressable
        onPress={() => openURL(url)}
        style={{
          backgroundColor: isDarkMode ? '#4646464F' : '#1A1A1A47',
          borderRadius: 15,
        }}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={{
              // width: scaledWidth,
              height: scaledHeight,
            }}
          />
        )}
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            marginHorizontal: 10,
            marginTop: 8,
            color: position === 'left' ? (isDarkMode ? Colors.white : Colors.black) : Colors.white,
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
            color: position === 'left' ? (isDarkMode ? Colors.white : Colors.black) : Colors.white,
          }}
        >
          {getDomainFromUrl(url)}
        </Text>
      </Pressable>
    );
  }
);
