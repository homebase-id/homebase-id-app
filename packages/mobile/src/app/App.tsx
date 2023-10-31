import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfilePage from '../pages/profile-page';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginPage from '../pages/login-page';
import FeedPage from '../pages/feed-page';
import CodePush from 'react-native-code-push';
import useAuth from '../hooks/auth/useAuth';
import FollowersPage from '../pages/profile/followers-page';
import ConnectionsPage from '../pages/profile/connections-page';
import FollowingPage from '../pages/profile/following-page';

export type AuthStackParamList = {
  Login: undefined;
  Authenticated: undefined;
};

export type TabStackParamList = {
  Feed: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Home: undefined;
};

export type ProfileStackParamList = {
  Overview: undefined;
  Followers: undefined;
  Connections: undefined;
  Following: undefined;
};

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      gcTime: Infinity,
      retry: 0,
    },
    queries: {
      retry: 2,
      gcTime: 1000 * 10,
    },
  },
});

const asyncPersist = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

let App = () => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        maxAge: Infinity,
        persister: asyncPersist,
      }}
      onSuccess={() =>
        queryClient
          .resumePausedMutations()
          .then(() => queryClient.invalidateQueries())
      }>
      <RootStack />
    </PersistQueryClientProvider>
  );
};

const codePushOptions = { checkFrequency: CodePush.CheckFrequency.MANUAL };
App = CodePush(codePushOptions)(App);

const RootStack = () => {
  const Stack = createNativeStackNavigator<AuthStackParamList>();
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Authenticated" component={AuthenticatedStack} />
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginPage}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AuthenticatedStack = () => {
  const Stack = createNativeStackNavigator<RootStackParamList>();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
      }}>
      <Stack.Screen
        name="Home"
        component={TabStack}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const TabStack = () => {
  const Stack = createNativeStackNavigator<TabStackParamList>();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Feed" component={FeedPage} />
      <Stack.Screen name="Profile" component={ProfileStack} />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  const Stack = createNativeStackNavigator<ProfileStackParamList>();

  return (
    <Stack.Navigator screenOptions={{ headerBackTitle: 'Profile' }}>
      <Stack.Screen
        name="Overview"
        component={ProfilePage}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="Followers" component={FollowersPage} />
      <Stack.Screen name="Connections" component={ConnectionsPage} />
      <Stack.Screen name="Following" component={FollowingPage} />
    </Stack.Navigator>
  );
};

export type SettingsStackParamList = {
  Profile: undefined;
};

export default App;
