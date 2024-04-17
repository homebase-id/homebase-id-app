import { CONTACT_PROFILE_IMAGE_KEY, ContactConfig } from '@youfoundation/js-lib/network';
import { GetTargetDriveFromProfileId, BuiltInProfiles } from '@youfoundation/js-lib/profile';
import { memo } from 'react';
import { ImageStyle, StyleProp, ViewStyle, View, StyleSheet } from 'react-native';
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
    return (
      <OdinImage
        fileId={contact?.fileId}
        fileKey={CONTACT_PROFILE_IMAGE_KEY}
        targetDrive={ContactConfig.ContactTargetDrive}
        previewThumbnail={contact?.fileMetadata.appData.previewThumbnail}
        imageSize={props.imageSize || { width: 48, height: 48 }}
        fit="contain"
        odinId={props.odinId}
        style={{
          ...styles.tinyLogo,
          ...props.style,
        }}
        lastModified={contact?.fileMetadata.updated}
      />
    );
  }
);

export const OwnerAvatar = memo(
  (props: { style?: ImageStyle; imageSize?: { width: number; height: number } }) => {
    const { data: profileData } = useProfile();

    return (
      <OdinImage
        fit="cover"
        targetDrive={GetTargetDriveFromProfileId(BuiltInProfiles.StandardProfileId)}
        fileId={profileData?.profileImageFileId}
        fileKey={profileData?.profileImageFileKey}
        previewThumbnail={profileData?.profileImagePreviewThumbnail}
        imageSize={props.imageSize || { width: 48, height: 48 }}
        style={{
          ...styles.tinyLogo,
          ...(props.imageSize || {}),
          ...props.style,
        }}
      />
    );
  }
);

export const GroupAvatar = memo(
  (props: {
    style?: StyleProp<ViewStyle>;
    iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | number;
  }) => {
    const { isDarkMode } = useDarkMode();
    return (
      <View
        style={[
          styles.tinyLogo,
          {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? Colors.slate[800] : Colors.purple[200],
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
