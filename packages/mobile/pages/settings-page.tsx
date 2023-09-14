import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '../components/ui/Text/Text';

import { SettingsStackParamList } from '../app/App';
import useAuth from 'homebase-feed-app/hooks/auth/useAuth';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../components/ui/Container/Container';
import { Profile } from '../components/ui/Icons/icons';

type SettingsProps = NativeStackScreenProps<SettingsStackParamList, 'Profile'>;

const SettingsPage = (_props: SettingsProps) => {
  const { logout, getIdentity } = useAuth();

  const doLogout = async () => logout();

  return (
    <SafeAreaView>
      <Container>
        <View style={{ display: 'flex', flexDirection: 'column' }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 8,
              paddingTop: 4,
            }}>
            {getIdentity()}
          </Text>
          <TouchableOpacity
            onPress={() => doLogout()}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
            }}>
            <Profile size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </Container>
    </SafeAreaView>
  );
};

export default SettingsPage;
