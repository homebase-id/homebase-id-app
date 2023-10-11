import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { Text } from '../components/ui/Text/Text';

import { ProfileStackParamList } from '../app/App';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../components/ui/Container/Container';
import {
  AddressBook,
  Download,
  People,
  Profile,
} from '../components/ui/Icons/icons';
import codePush from 'react-native-code-push';
import useAuth from '../hooks/auth/useAuth';
import { Colors } from '../app/Colors';
import { OdinImage } from '../components/ui/OdinImage/OdinImage';
import {
  BuiltInProfiles,
  GetTargetDriveFromProfileId,
} from '@youfoundation/js-lib/profile';
import { useProfile } from '../hooks/profile/useProfile';

type SettingsProps = NativeStackScreenProps<ProfileStackParamList, 'Overview'>;

const SettingsPage = (_props: SettingsProps) => {
  const { logout, getIdentity } = useAuth();
  const { data: profile } = useProfile();

  const doLogout = async () => logout();
  const doCheckForUpdate = async () => {
    codePush.sync({
      updateDialog: {},
      installMode: codePush.InstallMode.IMMEDIATE,
    });
  };

  const navigate = (target: keyof ProfileStackParamList) =>
    _props.navigation.navigate(target);

  return (
    <SafeAreaView>
      <Container>
        <View style={{ display: 'flex', flexDirection: 'column' }}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: Colors.slate[200],
              width: '100%',
              height: 200,
            }}>
            <OdinImage
              fit="contain"
              targetDrive={GetTargetDriveFromProfileId(
                BuiltInProfiles.StandardProfileId,
              )}
              fileId={profile?.profileImageId}
              imageSize={{ width: 160, height: 160 }}
              style={{ borderRadius: 160 / 2 }}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 8,
                paddingTop: 4,
              }}>
              {profile?.firstName || profile?.surName
                ? `${profile.firstName} ${profile.surName}`
                : getIdentity()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigate('Followers')}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}>
            <People size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}>
              My followers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigate('Connections')}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}>
            <AddressBook size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}>
              My connections
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigate('Following')}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              width: '100%',
            }}>
            <People size={'lg'} />
            <Text
              style={{
                marginLeft: 16,
              }}>
              Who I'm folowing
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
