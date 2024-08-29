import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView } from 'react-native';

import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../components/ui/Container/Container';

import { TabStackParamList } from '../../app/App';

import { NotificationsOverview } from '../../components/Dashboard/NotificationsOverview';
import { Dashboard } from '../../components/Dashboard/Dashboard';
import { ProfileInfo } from '../../components/Profile/ProfileInfo';

type HomeProps = NativeStackScreenProps<TabStackParamList, 'Home'>;

export const HomePage = (_props: HomeProps) => {
  return (
    <SafeAreaView>
      <Container>
        <ScrollView style={{ paddingVertical: 12 }} showsVerticalScrollIndicator={false}>
          <ProfileInfo />
          <Dashboard />
          <NotificationsOverview />
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};
