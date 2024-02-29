import { View, Text } from 'react-native';
import useContact from '../../hooks/contact/useContact';
import { OdinImage } from '../ui/OdinImage/OdinImage';
import { CONTACT_PROFILE_IMAGE_KEY, ContactConfig } from '@youfoundation/js-lib/network';
import { Colors } from '../../app/Colors';

export const IdentityItem = ({ odinId }: { odinId: string }) => {
  const { data: contactFile } = useContact(odinId).fetch;
  const contactContent = contactFile?.fileMetadata.appData.content;

  return (
    <View
      style={{
        padding: 5,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
      }}
    >
      {contactFile ? (
        <OdinImage
          fileId={contactFile?.fileId}
          fileKey={CONTACT_PROFILE_IMAGE_KEY}
          targetDrive={ContactConfig.ContactTargetDrive}
          imageSize={{ width: 50, height: 50 }}
        />
      ) : (
        <View
          style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.indigo[100] }}
        />
      )}
      <View>
        <Text style={{ fontWeight: '600', marginBottom: 2 }}>
          {contactContent?.name?.displayName || contactContent?.name?.surname || odinId}
        </Text>
        <Text>{odinId}</Text>
      </View>
    </View>
  );
};

export default IdentityItem;
