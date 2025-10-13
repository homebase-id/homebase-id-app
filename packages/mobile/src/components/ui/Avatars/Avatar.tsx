import { CONTACT_PROFILE_IMAGE_KEY, ContactConfig } from '@homebase-id/js-lib/network';
import { GetTargetDriveFromProfileId, BuiltInProfiles } from '@homebase-id/js-lib/profile';
import { memo, useMemo, useState } from 'react';
import {
  ImageStyle,
  StyleProp,
  ViewStyle,
  View,
  StyleSheet,
  Image,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import useContact from '../../../hooks/contact/useContact';
import { useProfile } from '../../../hooks/profile/useProfile';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Users } from '../Icons/icons';
import { OdinImage } from '../OdinImage/OdinImage';
import { Colors } from '../../../app/Colors';
import { SvgUri } from 'react-native-svg';
import { EmbeddedThumb, TargetDrive } from '@homebase-id/js-lib/core';
import Animated from 'react-native-reanimated';
import { FallbackImg } from '../FallbackImg/FallbackImg';

export const Avatar = memo(
  (props: {
    odinId: string;
    style?: ImageStyle;
    onPress?: () => void;
    imageSize?: { width: number; height: number };
  }) => {
    const { data: contact, isLoading } = useContact(props.odinId).fetch;
    if (isLoading) {
      return (
        <Animated.View style={[styles.tinyLogo, props.style]}>
          <ActivityIndicator size="small" color={Colors.violet[500]} />
        </Animated.View>
      );
    }

    if (
      contact?.fileMetadata.payloads &&
      contact?.fileMetadata.payloads.some((p) => p.key === CONTACT_PROFILE_IMAGE_KEY)
    ) {
      return (
        <View style={[styles.tinyLogo, props.style]}>
          <OdinImage
            fileId={contact?.fileId}
            fileKey={CONTACT_PROFILE_IMAGE_KEY}
            targetDrive={ContactConfig.ContactTargetDrive}
            previewThumbnail={contact?.fileMetadata.appData.previewThumbnail}
            imageSize={props.imageSize || { width: 48, height: 48 }}
            fit="contain"
            lastModified={contact?.fileMetadata.updated}
            onClick={props.onPress}
          />
        </View>
      );
    } else {
      return <PublicAvatar {...props} />;
    }
  }
);

export const PublicAvatar = (props: {
  odinId: string;
  style?: ImageStyle;
  onPress?: () => void;
  imageSize?: { width: number; height: number };
}) => {
  const [isSvg, setIsSvg] = useState(false);

  if (!isSvg) {
    return (
      <Pressable onPress={props.onPress}>
        <Image
          style={[styles.tinyLogo, props.style]}
          onError={() => {
            // console.error('Error loading image', e.nativeEvent.error);
            setIsSvg(true);
          }}
          source={{ uri: `https://${props.odinId}/pub/image` }}
        />
      </Pressable>
    );
  } else {
    return (
      <View
        style={[
          styles.tinyLogo,
          props.imageSize,
          props.style,
          Platform.OS === 'android' ? props.style : undefined,
        ]}
      >
        <Pressable onPress={props.onPress}>
          <SvgUri
            width={props.imageSize?.width}
            height={props.imageSize?.height}
            uri={`https://${props.odinId}/pub/image`}
            style={[styles.svgOverflow, props.style]}
            fallback={<FallbackImg odinId={props.odinId} style={props.style} />}
          />
        </Pressable>
      </View>
    );
  }
};

export const OwnerAvatar = memo(
  (props: { style?: ImageStyle; imageSize?: { width: number; height: number } }) => {
    const { data: profileData } = useProfile();

    return (
      <View style={[styles.tinyLogo, props.imageSize, props.style]}>
        <OdinImage
          fit="cover"
          targetDrive={GetTargetDriveFromProfileId(BuiltInProfiles.StandardProfileId)}
          fileId={profileData?.profileImageFileId}
          fileKey={profileData?.profileImageFileKey}
          previewThumbnail={profileData?.profileImagePreviewThumbnail}
          imageSize={props.imageSize || { width: 48, height: 48 }}
        />
      </View>
    );
  }
);

export const GroupAvatar = memo(
  ({
    fileId,
    fileKey,
    previewThumbnail,
    imageStyle,
    targetDrive,
    style,
    iconSize,
  }: {
    fileId?: string;
    fileKey?: string;
    previewThumbnail?: EmbeddedThumb;
    imageStyle?: {
      width: number;
      height: number;
    };
    targetDrive?: TargetDrive;
    style?: StyleProp<ViewStyle>;
    iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | number;
  }) => {
    const { isDarkMode } = useDarkMode();
    const backgroundColor = useMemo(
      () => (isDarkMode ? Colors.indigo[900] : Colors.violet[200]),
      [isDarkMode]
    );
    if (!fileId || !fileKey || !targetDrive) {
      return (
        <View style={[styles.tinyLogo, styles.centered, { backgroundColor }, style]}>
          <Users size={iconSize} />
        </View>
      );
    }
    return (
      <View style={[styles.tinyLogo, styles.centered, { backgroundColor }, style]}>
        <OdinImage
          fileId={fileId}
          fileKey={fileKey}
          targetDrive={targetDrive}
          previewThumbnail={previewThumbnail}
          imageSize={imageStyle || { width: 48, height: 48 }}
          fit="cover"
        />
      </View>
    );
  }
);

export const DefaultGroupAvatar = memo(
  (props: {
    style?: StyleProp<ViewStyle>;
    iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | number;
  }) => {
    const { isDarkMode } = useDarkMode();
    const backgroundColor = useMemo(
      () => (isDarkMode ? Colors.indigo[900] : Colors.violet[200]),
      [isDarkMode]
    );
    return (
      <View style={[styles.tinyLogo, styles.centered, { backgroundColor }, props.style]}>
        <Users size={props.iconSize} />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  tinyLogo: {
    objectFit: 'cover',
    marginLeft: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgOverflow: {
    overflow: 'hidden',
  },
});
