import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '../../components/ui/Text/Text';

import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../components/ui/Container/Container';
import { useAuth } from '../../hooks/auth/useAuth';
import { Colors } from '../../app/Colors';
import { OdinImage } from '../../components/ui/OdinImage/OdinImage';
import { BuiltInProfiles, GetTargetDriveFromProfileId } from '@youfoundation/js-lib/profile';
import { useProfile } from '../../hooks/profile/useProfile';
import { HomeStackParamList } from '../../app/App';
import { AddressBook } from '../../components/ui/Icons/icons';
import { useDarkMode } from '../../hooks/useDarkMode';

type HomeProps = NativeStackScreenProps<HomeStackParamList, 'Overview'>;

export const HomePage = (_props: HomeProps) => {
  const isDarkMode = useDarkMode();
  const { getIdentity } = useAuth();

  const { data: profile } = useProfile();

  const navigate = (target: keyof HomeStackParamList) => _props.navigation.navigate(target);
  return (
    <SafeAreaView>
      <Container>
        <View style={{ display: 'flex', flexDirection: 'column', paddingVertical: 12 }}>
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
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 8,
                paddingTop: 4,
              }}
            >
              {profile?.firstName || profile?.surName
                ? `${profile.firstName} ${profile.surName}`
                : getIdentity()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigate('ConnectionRequests')}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            width: '100%',
          }}
        >
          <AddressBook size={'lg'} />
          <Text
            style={{
              marginLeft: 16,
            }}
          >
            Connection requests
          </Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          onPress={() => navigate('Notifications')}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            width: '100%',
          }}
        >
          <AddressBook size={'lg'} />
          <Text
            style={{
              marginLeft: 16,
            }}
          >
            Notifications
          </Text>
        </TouchableOpacity> */}
      </Container>
    </SafeAreaView>
  );
};
