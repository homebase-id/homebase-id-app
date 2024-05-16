import { CONTACT_PROFILE_IMAGE_KEY, ContactConfig } from '@youfoundation/js-lib/network';
import { GetTargetDriveFromProfileId, BuiltInProfiles } from '@youfoundation/js-lib/profile';
import { memo, useMemo } from 'react';
import { ImageStyle, StyleProp, ViewStyle, View, StyleSheet, Image } from 'react-native';
import useContact from '../../../hooks/contact/useContact';
import { useProfile } from '../../../hooks/profile/useProfile';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Users } from '../Icons/icons';
import { OdinImage } from '../OdinImage/OdinImage';
import { Colors } from '../../../app/Colors';

export const Avatar = memo(
  (props: {
    odinId: string;
    style?: ImageStyle;
    imageSize?: { width: number; height: number };
  }) => {
    const { data: contact } = useContact(props.odinId).fetch;
    if (contact?.fileMetadata.payloads.some((p) => p.key === CONTACT_PROFILE_IMAGE_KEY)) {
      return (
        <View style={{ ...styles.tinyLogo, ...props.style }}>
          <OdinImage
            fileId={contact?.fileId}
            fileKey={CONTACT_PROFILE_IMAGE_KEY}
            targetDrive={ContactConfig.ContactTargetDrive}
            previewThumbnail={contact?.fileMetadata.appData.previewThumbnail}
            imageSize={props.imageSize || { width: 48, height: 48 }}
            fit="contain"
            odinId={props.odinId}
            lastModified={contact?.fileMetadata.updated}
          />
        </View>
      );
    } else {
      return (
        <Image style={styles.tinyLogo} source={{ uri: `https://${props.odinId}/pub/image` }} />
      );
    }
  }
);

export const OwnerAvatar = memo(
  (props: { style?: ImageStyle; imageSize?: { width: number; height: number } }) => {
    const { data: profileData } = useProfile();

    return (
      <View style={{ ...styles.tinyLogo, ...(props.imageSize || {}), ...props.style }}>
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
      <View
        style={[
          styles.tinyLogo,
          {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: backgroundColor,
          },
          props.style,
        ]}
      >
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
});
