import { View, Text } from 'react-native';
import useContact from '../../hooks/contact/useContact';
import { OdinImage } from '../ui/OdinImage/OdinImage';
import { CONTACT_PROFILE_IMAGE_KEY, ContactConfig } from '@youfoundation/js-lib/network';

export const IdentityItem = ({ odinId }: { odinId: string }) => {
  const { data: contact } = useContact(odinId).fetch;

  return (
    <View
      style={{
        padding: 5,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
      }}>
      <OdinImage
        fileId={contact?.fileId}
        fileKey={CONTACT_PROFILE_IMAGE_KEY}
        targetDrive={ContactConfig.ContactTargetDrive}
        imageSize={{ width: 50, height: 50 }}
      />
      <View>
        <Text style={{ fontWeight: '600', marginBottom: 2 }}>
          {contact?.name?.displayName || contact?.name?.surname || odinId}
        </Text>
        <Text>{odinId}</Text>
      </View>
    </View>
  );
};

export default IdentityItem;
