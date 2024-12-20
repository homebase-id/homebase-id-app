import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import { useMemo } from 'react';
import { Colors } from './Colors';

// Pages
import { ConnectionsPage } from '../pages/profile/connections-page';
import { FollowersPage } from '../pages/profile/followers-page';
import { FollowingPage } from '../pages/profile/following-page';
import { ProfilePage } from '../pages/profile/profile-page';
import { ConnectionRequestsPage } from '../pages/profile/connection-requests-page';
import { useDarkMode } from '../hooks/useDarkMode';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { DriveStatusPage } from '../pages/profile/drive-status-page';
import { ConnectQrPage } from '../pages/profile/connect-qr-page';
import { AppearancePage } from '../pages/profile/appearance/Appearance-Page';
import { ChatColorSettings } from '../pages/profile/appearance/ChatColorSettings';
import { DebugPage } from '../pages/profile/debug-page';
import { ChatSettingsPage } from '../pages/profile/chat-settings.page';

export type ProfileStackParamList = {
  Overview: undefined;
  Followers: undefined;
  ConnectionRequests: undefined;
  Appearance: undefined;
  ChatColorSettings: undefined;
  Connections: undefined;
  Following: undefined;
  DriveStatus: undefined;
  ConnectQr: undefined;
  Debug: undefined;
  ChatSettings: undefined;
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
        headerBackButtonMenuEnabled: false,
        headerBackTitleVisible: false,
        headerTintColor: isDarkMode ? Colors.white : Colors.black,
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
      <StackProfile.Screen name="Appearance" component={AppearancePage} />
      <StackProfile.Screen
        name="ChatColorSettings"
        options={{
          title: 'Chat Color',
        }}
        component={ChatColorSettings}
      />
      <StackProfile.Screen name="Following" component={FollowingPage} />
      <StackProfile.Screen name="DriveStatus" component={DriveStatusPage} />
      <StackProfile.Screen name="Debug" component={DebugPage} />
      <StackProfile.Screen
        name="ChatSettings"
        options={{
          title: 'Chat Settings',
        }}
        component={ChatSettingsPage}
      />
    </StackProfile.Navigator>
  );
};
