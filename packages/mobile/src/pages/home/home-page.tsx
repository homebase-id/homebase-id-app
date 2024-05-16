import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StatusBar } from 'react-native';

import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../components/ui/Container/Container';
import { Colors } from '../../app/Colors';
import { TabStackParamList } from '../../app/App';
import { useDarkMode } from '../../hooks/useDarkMode';
import { NotificationsOverview } from '../../components/Dashboard/NotificationsOverview';
import { Dashboard } from '../../components/Dashboard/Dashboard';
import { ProfileInfo } from '../../components/Profile/ProfileInfo';

type HomeProps = NativeStackScreenProps<TabStackParamList, 'Home'>;

export const HomePage = (_props: HomeProps) => {
  return (
    <SafeAreaView>
      <Container>
        <ScrollView style={{ minHeight: '100%', paddingVertical: 12 }}>
          <ProfileInfo />
          <Dashboard />
          <NotificationsOverview />
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};
