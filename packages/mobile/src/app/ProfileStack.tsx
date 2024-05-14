import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import { useMemo } from 'react';
import { Colors } from './Colors';

// Pages
import { ConnectionsPage } from '../pages/profile/connections-page';
import { FollowersPage } from '../pages/profile/followers-page';
import { FollowingPage } from '../pages/profile/following-page';
import { ProfilePage } from '../pages/profile/profile-page';
import { ConnectionRequestsPage } from '../pages/home/connection-requests-page';
import { useDarkMode } from '../hooks/useDarkMode';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { DriveStatusPage } from '../pages/profile/drive-status-page';
import { ConnectQrPage } from '../pages/profile/connect-qr-page';

export type ProfileStackParamList = {
  Overview: undefined;
  Followers: undefined;
  ConnectionRequests: undefined;
  Connections: undefined;
  Following: undefined;
  DriveStatus: undefined;
  ConnectQr: undefined;
};

const StackProfile = createNativeStackNavigator<ProfileStackParamList>();
export const ProfileStack = () => {
  const { isDarkMode } = useDarkMode();
  const screenOptions = useMemo(
    () =>
      ({
        headerBackTitle: 'Profile',
        statusBarColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        statusBarStyle: Platform.OS === 'android' ? (isDarkMode ? 'light' : 'dark') : undefined,
        headerStyle: {
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        },
      }) as NativeStackNavigationOptions,
    [isDarkMode]
  );
  return (
    <StackProfile.Navigator screenOptions={screenOptions}>
      <StackProfile.Screen
        name="Overview"
        component={ProfilePage}
        options={{
          headerShown: false,
        }}
      />
      <StackProfile.Screen
        name="ConnectQr"
        component={ConnectQrPage}
        options={{
          title: 'QR Code',
        }}
      />
      <StackProfile.Screen name="Followers" component={FollowersPage} />
      <StackProfile.Screen name="ConnectionRequests" component={ConnectionRequestsPage} />
      <StackProfile.Screen name="Connections" component={ConnectionsPage} />
      <StackProfile.Screen name="Following" component={FollowingPage} />
      <StackProfile.Screen name="DriveStatus" component={DriveStatusPage} />
    </StackProfile.Navigator>
  );
};
