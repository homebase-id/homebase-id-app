import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfilePage from '../pages/profile-page';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginPage from '../pages/login-page';
import { Cog, Feed, Profile } from '../components/ui/Icons/icons';
import FeedPage from '../pages/feed-page';
import CodePush from 'react-native-code-push';
import useAuth from '../hooks/auth/useAuth';

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

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      cacheTime: Infinity,
      retry: 0,
    },
    queries: {
      retry: 2,
      cacheTime: 1000 * 10,
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

type TabIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

const TabStack = () => {
  const Tab = createBottomTabNavigator<TabStackParamList>();

  const photosIcon = (props: TabIconProps) => <Feed {...props} />;
  const settingsIcon = (props: TabIconProps) => <Profile {...props} />;

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Feed"
        component={FeedPage}
        options={{
          headerShown: false,
          tabBarIcon: photosIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePage}
        options={{
          tabBarIcon: settingsIcon,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export type SettingsStackParamList = {
  Profile: undefined;
};

export default App;
