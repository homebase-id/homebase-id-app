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
import { useAuth, useValidTokenCheck } from '../hooks/auth/useAuth';
import FollowersPage from '../pages/profile/followers-page';
import ConnectionsPage from '../pages/profile/connections-page';
import FollowingPage from '../pages/profile/following-page';
import { DotYouClientProvider } from '../components/Auth/DotYouClientProvider';

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
        queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries())
      }
    >
      <RootStack />
    </PersistQueryClientProvider>
  );
};

const codePushOptions = { checkFrequency: CodePush.CheckFrequency.MANUAL };
App = CodePush(codePushOptions)(App);

const StackRoot = createNativeStackNavigator<AuthStackParamList>();
const RootStack = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <StackRoot.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <StackRoot.Screen name="Authenticated" component={AuthenticatedStack} />
        ) : (
          <>
            <StackRoot.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
          </>
        )}
      </StackRoot.Navigator>
    </NavigationContainer>
  );
};

const StackAuthenticated = createNativeStackNavigator<RootStackParamList>();
const AuthenticatedStack = () => {
  useValidTokenCheck();

  return (
    <DotYouClientProvider>
      <StackAuthenticated.Navigator
        screenOptions={{
          headerShadowVisible: false,
        }}
      >
        <StackAuthenticated.Screen
          name="Home"
          component={TabStack}
          options={{ headerShown: false }}
        />
      </StackAuthenticated.Navigator>
    </DotYouClientProvider>
  );
};

const StackTab = createNativeStackNavigator<TabStackParamList>();
const TabStack = () => {
  return (
    <StackTab.Navigator screenOptions={{ headerShown: false }}>
      <StackTab.Screen name="Feed" component={FeedPage} />
      <StackTab.Screen name="Profile" component={ProfileStack} />
    </StackTab.Navigator>
  );
};

const StackProfile = createNativeStackNavigator<ProfileStackParamList>();
const ProfileStack = () => {
  return (
    <StackProfile.Navigator screenOptions={{ headerBackTitle: 'Profile' }}>
      <StackProfile.Screen
        name="Overview"
        component={ProfilePage}
        options={{
          headerShown: false,
        }}
      />
      <StackProfile.Screen name="Followers" component={FollowersPage} />
      <StackProfile.Screen name="Connections" component={ConnectionsPage} />
      <StackProfile.Screen name="Following" component={FollowingPage} />
    </StackProfile.Navigator>
  );
};

export type SettingsStackParamList = {
  Profile: undefined;
};

export default App;
