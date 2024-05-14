import { GetTargetDriveFromProfileId, BuiltInProfiles } from '@youfoundation/js-lib/profile';
import { TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/auth/useAuth';
import { useProfile } from '../../hooks/profile/useProfile';
import { useDarkMode } from '../../hooks/useDarkMode';
import { OdinImage } from '../ui/OdinImage/OdinImage';
import { Colors } from '../../app/Colors';
import { Text } from '../ui/Text/Text';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ProfileStackParamList } from '../../app/ProfileStack';
import { QrIcon } from '../ui/Icons/icons';

export const ProfileInfo = () => {
  const { isDarkMode } = useDarkMode();
  const { getIdentity } = useAuth();

  const { data: profile } = useProfile();
  const navigation = useNavigation<NavigationProp<ProfileStackParamList>>();

  return (
    <TouchableOpacity onPress={() => navigation.navigate('ConnectQr')}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? Colors.slate[700] : Colors.slate[200],
          width: '100%',
          height: 200,
        }}
      >
        <OdinImage
          fit="cover"
          targetDrive={GetTargetDriveFromProfileId(BuiltInProfiles.StandardProfileId)}
          fileId={profile?.profileImageFileId}
          fileKey={profile?.profileImageFileKey}
          imageSize={{ width: 160, height: 160 }}
          style={{ borderRadius: 160 / 2 }}
          onClick={() => navigation.navigate('ConnectQr')}
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 8,
            paddingTop: 4,
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {profile?.firstName || profile?.surName
            ? `${profile.firstName} ${profile.surName}`
            : getIdentity()}
        </Text>

        <View
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row-reverse',
            position: 'relative',
            top: -25,
          }}
        >
          <QrIcon />
        </View>
      </View>
    </TouchableOpacity>
  );
};
