import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StatusBar, View } from 'react-native';
import { Text } from '../../components/ui/Text/Text';

import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../components/ui/Container/Container';
import { useAuth } from '../../hooks/auth/useAuth';
import { Colors } from '../../app/Colors';
import { OdinImage } from '../../components/ui/OdinImage/OdinImage';
import { BuiltInProfiles, GetTargetDriveFromProfileId } from '@youfoundation/js-lib/profile';
import { useProfile } from '../../hooks/profile/useProfile';
import { TabStackParamList } from '../../app/App';
import { useDarkMode } from '../../hooks/useDarkMode';
import { NotificationsOverview } from '../../components/Dashboard/NotificationsOverview';
import { Dashboard } from '../../components/Dashboard/Dashboard';

type HomeProps = NativeStackScreenProps<TabStackParamList, 'Home'>;

export const HomePage = (_props: HomeProps) => {
  const { isDarkMode } = useDarkMode();
  const { getIdentity } = useAuth();

  const { data: profile } = useProfile();

  return (
    <SafeAreaView>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? Colors.gray[900] : Colors.slate[50]}
      />
      <Container>
        <ScrollView style={{ minHeight: '100%' }}>
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
          <Dashboard />
          <NotificationsOverview />
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};
