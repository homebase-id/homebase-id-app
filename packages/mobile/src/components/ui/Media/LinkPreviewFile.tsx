import { TargetDrive } from '@youfoundation/js-lib/core';
import { memo } from 'react';
import { Dimensions, Image, Pressable } from 'react-native';
import { useLinkMetadata } from '../../../hooks/links/useLinkPreview';
import { calculateScaledDimensions, openURL } from '../../../utils/utils';
import { Text } from '../Text/Text';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';

type LinkPreviewFileProps = {
  targetDrive: TargetDrive;
  fileId: string;
  payloadKey: string;
  position: string;
};

export const LinkPreviewFile = memo(
  ({ targetDrive, fileId, payloadKey, position }: LinkPreviewFileProps) => {
    const { data } = useLinkMetadata({ targetDrive, fileId, payloadKey });
    const { isDarkMode } = useDarkMode();
    if (!data || !data.length) {
      return null;
    }
    const { title, description, imageUrl, imageHeight, imageWidth, url } = data[0];
    const { width, height } = Dimensions.get('window');
    const { height: scaledHeight, width: scaledWidth } = calculateScaledDimensions(
      imageWidth || 300,
      imageHeight || 300,
      {
        width: width * 0.8,
        height: height * 0.68,
      }
    );
    return (
      <Pressable onPress={() => openURL(url)}>
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: scaledWidth,
            height: scaledHeight,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
          }}
        />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            marginHorizontal: 10,
            marginTop: 8,
            color: position === 'left' ? (isDarkMode ? Colors.white : Colors.black) : Colors.white,
          }}
        >
          {title}
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
      </Pressable>
    );
  }
);
