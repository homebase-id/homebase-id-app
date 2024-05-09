import { View, Text } from 'react-native';
import useContact from '../../hooks/contact/useContact';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Avatar } from '../ui/Avatars/Avatar';

export const IdentityItem = ({ odinId }: { odinId: string }) => {
  const { isDarkMode } = useDarkMode();
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
        <Avatar
          odinId={odinId}
          style={{ borderRadius: 25, overflow: 'hidden' }}
          imageSize={{ width: 50, height: 50 }}
        />
      ) : (
        <View
          style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.indigo[100] }}
        />
      )}
      <View>
        <Text
          style={{
            fontWeight: '600',
            marginBottom: 2,
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {contactContent?.name?.displayName || contactContent?.name?.surname || odinId}
        </Text>
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {odinId}
        </Text>
      </View>
    </View>
  );
};

export default IdentityItem;
