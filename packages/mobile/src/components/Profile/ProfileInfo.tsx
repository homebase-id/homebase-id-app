import { GetTargetDriveFromProfileId, BuiltInProfiles } from '@youfoundation/js-lib/profile';
import { TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/auth/useAuth';
import { useProfile } from '../../hooks/profile/useProfile';
import { useDarkMode } from '../../hooks/useDarkMode';
import { OdinImage } from '../ui/OdinImage/OdinImage';
import { Colors } from '../../app/Colors';
import { Text } from '../ui/Text/Text';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import { ProfileStackParamList } from '../../app/ProfileStack';
import { QrIcon } from '../ui/Icons/icons';
import { useCallback } from 'react';

export const ProfileInfo = () => {
  const { isDarkMode } = useDarkMode();
  const { getIdentity } = useAuth();

  const { data: profile } = useProfile();
  const navigation = useNavigation<NavigationProp<ProfileStackParamList>>();
  const { name } = useRoute();

  const showQr = !(name === 'Home');
  const onNavigate = useCallback(() => {
    return navigation.navigate('ConnectQr');
  }, [navigation]);

  return (
    <TouchableOpacity disabled={!showQr} onPress={onNavigate}>
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
          onClick={showQr ? onNavigate : undefined}
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

        {showQr ? (
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
        ) : null}
      </View>
    </TouchableOpacity>
  );
};
