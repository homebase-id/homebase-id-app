import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CodePush from 'react-native-code-push';
import { useAuth, useValidTokenCheck } from '../hooks/auth/useAuth';
import { DotYouClientProvider } from '../components/Auth/DotYouClientProvider';
import { Platform } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { memo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from './Colors';

// Pages
import { FeedPage } from '../pages/feed/feed-page';
import { HomePage } from '../pages/home/home-page';
import { LoginPage } from '../pages/login/login-page';
import { useDarkMode } from '../hooks/useDarkMode';
import { useRefetchOnFocus } from '../hooks/platform/useRefetchOnFocus';
import { useOnlineManager } from '../hooks/platform/useOnlineManager';
import { PushNotificationProvider } from '../components/push-notification/PushNotificationProvider';
import { useAuthenticatedPushNotification } from '../hooks/push-notification/useAuthenticatedPushNotification';
import Toast from 'react-native-toast-message';
import { ErrorToaster } from '../components/ui/Alert/ErrorToaster';
import {
  TabFeedIcon,
  TabHouseIcon,
  TabChatIcon,
  TabMenuIcon,
} from '../components/Nav/TabStackIcons';
import { AudioContextProvider } from '../components/AudioContext/AudioContext';
import { useInitialPushNotification } from '../hooks/push-notification/useInitialPushNotification';
import { ErrorBoundary } from '../components/ui/ErrorBoundary/ErrorBoundary';
import { RouteContextProvider, useRouteContext } from '../components/RouteContext/RouteContext';
import { useShareManager } from '../hooks/platform/useShareManager';
import { OdinQueryClient } from './OdinQueryClient';
import { ChatStack } from './ChatStack';
import { ProfileStack } from './ProfileStack';
import BootSplash from 'react-native-bootsplash';

export type AuthStackParamList = {
  Login: undefined;
  Authenticated: undefined;
};

export type TabStackParamList = {
  Home: undefined;
  Feed: undefined;
  Profile: undefined;
  Chat: undefined;
};

export type HomeStackParamList = {
  Overview: undefined;
  ConnectionRequests: undefined;
};

let App = () => {
  return (
    <OdinQueryClient>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PushNotificationProvider>
          <RouteContextProvider>
            <RootStack />
            <Toast />
          </RouteContextProvider>
        </PushNotificationProvider>
      </GestureHandlerRootView>
    </OdinQueryClient>
  );
};

const codePushOptions = { checkFrequency: CodePush.CheckFrequency.MANUAL };
App = CodePush(codePushOptions)(App);

const navigationContainerRef = createNavigationContainerRef();
const StackRoot = createNativeStackNavigator<AuthStackParamList>();
const RootStack = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useDarkMode();
  const { setRouteName } = useRouteContext();

  return (
    <NavigationContainer
      ref={navigationContainerRef}
      theme={isDarkMode ? DarkTheme : DefaultTheme}
      onReady={() => {
        setRouteName(navigationContainerRef.getCurrentRoute()?.name || null);
        BootSplash.hide();
      }}
      onStateChange={async () => {
        const currentRouteName = navigationContainerRef.getCurrentRoute()?.name || null;
        setRouteName(currentRouteName);
      }}
    >
      <StackRoot.Navigator
        screenOptions={{
          headerShown: false,
          statusBarColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          /// StatusBarStyle throws error when changin in Ios (even setting to Ui UIControllerbasedStatusBar to yes)
          statusBarStyle: Platform.OS === 'android' ? (isDarkMode ? 'light' : 'dark') : undefined,
        }}
      >
        {isAuthenticated ? (
          <StackRoot.Screen name="Authenticated" component={AuthenticatedRoot} />
        ) : (
          <StackRoot.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
        )}
      </StackRoot.Navigator>
      <ErrorToaster />
    </NavigationContainer>
  );
};

const AuthenticatedRoot = memo(() => {
  return (
    <DotYouClientProvider>
      <AudioContextProvider>
        <ErrorBoundary>
          <AppStackScreen />
        </ErrorBoundary>
      </AudioContextProvider>
    </DotYouClientProvider>
  );
});

const AppStackScreen = memo(() => {
  // CHECK: Re-renders a lot because of all the hooks, is it faster to move them in a separate component?
  useValidTokenCheck();
  useRefetchOnFocus();
  useOnlineManager();
  useAuthenticatedPushNotification();
  useInitialPushNotification();
  useShareManager();

  return <TabStack />;
});

const TabBottom = createBottomTabNavigator<TabStackParamList>();
const TabStack = memo(() => {
  const { isDarkMode } = useDarkMode();

  const rootRoutes = ['Home', 'Feed', 'Chat', 'Profile', 'Conversation', 'NewChat', 'NewGroup'];
  const { routeName } = useRouteContext();
  const hide = !routeName || !rootRoutes.includes(routeName);
  // TODO: Hide seems slow for the chat-page.. While actually it's the ChatScreen being slow in detecting it's correct size

  return (
    <TabBottom.Navigator
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: isDarkMode ? Colors.white : Colors.black,
        tabBarActiveTintColor: isDarkMode ? Colors.white : Colors.black,
        tabBarActiveBackgroundColor: isDarkMode ? Colors.indigo[700] : Colors.indigo[200],
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100],
        },
      }}
      initialRouteName="Chat"
    >
      <TabBottom.Screen
        name="Home"
        component={HomePage}
        options={{
          tabBarIcon: TabHouseIcon,
        }}
      />
      <TabBottom.Screen
        name="Feed"
        component={FeedPage}
        options={{
          tabBarIcon: TabFeedIcon,
          // Ios does not load webview until the window is focussed so keep it lazy until needed
          // see: https://github.com/react-native-webview/react-native-webview/pull/813#issuecomment-526216535
          // UPD: https://github.com/react-native-webview/react-native-webview/pull/3041
          lazy: Platform.OS === 'android' ? false : true,
        }}
      />
      <TabBottom.Screen
        name="Chat"
        component={ChatStack}
        options={{
          tabBarIcon: TabChatIcon,
          headerShown: false,
          tabBarStyle: hide
            ? Platform.OS === 'android'
              ? { height: 0, overflow: 'hidden', opacity: 0 }
              : { display: 'none' }
            : { backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100] },
        }}
      />
      <TabBottom.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: TabMenuIcon,
        }}
      />
    </TabBottom.Navigator>
  );
});

export default App;
