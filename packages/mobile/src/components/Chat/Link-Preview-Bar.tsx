import Animated from 'react-native-reanimated';
import { useLinkPreview } from '../../hooks/links/useLinkPreview';

import { Text } from '../ui/Text/Text';
import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Close } from '../ui/Icons/icons';
import { LinkPreview } from '@homebase-id/js-lib/media';

export type LinkPreviewProps = {
  textToSearchIn: string;
  onLinkData: (linkPreview: LinkPreview) => void;
  onDismiss: () => void;
};

export const LinkPreviewBar = memo(
  ({ textToSearchIn, onDismiss, onLinkData }: LinkPreviewProps) => {
    const link = textToSearchIn.match(/(https?:\/\/[^\s]+)/g)?.[0];
    const { data, isLoading } = useLinkPreview(link).get;
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (data) {
        setIsVisible(true);

        // If no desciprtion, title or data, no need to set the link preview
        if (!data?.description || !data?.title) return;

        onLinkData(data);
      }
    }, [data, onLinkData]);

    const dismissLinkPreview = useCallback(() => {
      setIsVisible(false);
      onDismiss?.();
    }, [onDismiss]);

    if (isLoading) {
      return (
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: 'gray',
            borderRadius: 15,
            justifyContent: 'center',
            padding: 8,
            marginLeft: 8,
            marginRight: 8,
            marginBottom: 4,
            position: 'relative',
          }}
        >
          <ActivityIndicator size="small" color="gray" />
        </View>
      );
    }

    if (!isVisible || !data) {
      return null;
    }
    const { title, description, imageUrl } = data;
    return (
      <Animated.View
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {imageUrl && (
          <Animated.Image
            source={{ uri: imageUrl }}
            style={{
              width: 50,
              // height: 50,
            }}
          />
        )}
        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              marginHorizontal: 10,
              marginTop: 8,
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
              }}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>

        <TouchableOpacity
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
          }}
          onPress={dismissLinkPreview}
          style={{
            flexGrow: 1,
            alignSelf: 'flex-end',
            margin: 4,
          }}
        >
          <Close />
        </TouchableOpacity>
      </Animated.View>
    );
  }
);
