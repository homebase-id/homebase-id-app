import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '../components/ui/Text/Text';

import { SettingsStackParamList } from '../app/App';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../components/ui/Container/Container';
import { Download, Profile } from '../components/ui/Icons/icons';
import codePush from 'react-native-code-push';
import useAuth from '../hooks/auth/useAuth';

type SettingsProps = NativeStackScreenProps<SettingsStackParamList, 'Profile'>;

const SettingsPage = (_props: SettingsProps) => {
  const { logout, getIdentity } = useAuth();

  const doLogout = async () => logout();
  const doCheckForUpdate = async () => {
    codePush.sync({
      updateDialog: {},
      installMode: codePush.InstallMode.IMMEDIATE,
    });
  };

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
          <TouchableOpacity
            onPress={() => doCheckForUpdate()}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}>
            <Download size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}>
              Check for app updates
            </Text>
          </TouchableOpacity>
        </View>
      </Container>
    </SafeAreaView>
  );
};

export default SettingsPage;
