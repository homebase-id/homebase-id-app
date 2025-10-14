import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigatorScreenParams,
  createNavigationContainerRef,
} from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { DotYouClientProvider } from '../components/Auth/DotYouClientProvider';
import {
  circleDrives,
  drives,
  permissions,
  useAuth,
  useValidTokenCheck,
} from '../hooks/auth/useAuth';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { memo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from './Colors';

// Pages
import { PushNotificationProvider } from '../components/push-notification/PushNotificationProvider';
import { useOnlineManager } from '../hooks/platform/useOnlineManager';
import { useRefetchOnFocus } from '../hooks/platform/useRefetchOnFocus';
import { useAuthenticatedPushNotification } from '../hooks/push-notification/useAuthenticatedPushNotification';
import { useDarkMode } from '../hooks/useDarkMode';
import { HomePage } from '../pages/home/home-page';
import { LoginPage } from '../pages/login/login-page';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { t } from 'homebase-id-app-common';
import BootSplash from 'react-native-bootsplash';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AudioContextProvider } from '../components/AudioContext/AudioContext';
import BubbleColorProvider from '../components/BubbleContext/BubbleContext';
import {
  TabChatIcon,
  TabCommunityIcon,
  TabFeedIcon,
  TabHouseIcon,
  TabMenuIcon,
} from '../components/Nav/TabStackIcons';
import { ExtendPermissionDialog } from '../components/Permissions/ExtendPermissionDialog';
import { RouteContextProvider, useRouteContext } from '../components/RouteContext/RouteContext';
import ChatSettingsProvider from '../components/Settings/ChatSettingsContext';
import { ErrorToaster } from '../components/ui/Alert/ErrorToaster';
import { NotificationToaster } from '../components/ui/Alert/NotificationToaster';
import { ErrorBoundary } from '../components/ui/ErrorBoundary/ErrorBoundary';
import { Toast } from '../components/ui/Toast/Toast';
import { WebSocketContextProvider } from '../components/WebSocketContext/WebSocketContext';
import { useCacheCleanup } from '../hooks/file/useCacheCleanup';
import { useShareManager } from '../hooks/platform/useShareManager';
import { useInitialPushNotification } from '../hooks/push-notification/useInitialPushNotification';
import { CommunityPage } from '../pages/community/community-page';
import { ChatStack, ChatStackParamList } from './ChatStack';
import { FEED_CHAT_APP_ID } from './constants';
import { FeedStack, FeedStackParamList } from './FeedStack';
import { OdinQueryClient } from './OdinQueryClient';
import { ProfileStack, ProfileStackParamList } from './ProfileStack';

export type AuthStackParamList = {
  Login: undefined;
  Authenticated: NavigatorScreenParams<TabStackParamList> | undefined;
};

export type TabStackParamList = {
  Home: undefined;
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Community: {
    typeId?: string;
    tagId?: string;
  };
};

export type HomeStackParamList = {
  Overview: undefined;
  ConnectionRequests: undefined;
};

const App = () => {
  return (
    <OdinQueryClient>
      <GestureHandlerRootView>
        <PushNotificationProvider>
          <RouteContextProvider>
            <DotYouClientProvider>
              <KeyboardProvider>
                <RootStack />
                <Toast />
              </KeyboardProvider>
            </DotYouClientProvider>
          </RouteContextProvider>
        </PushNotificationProvider>
      </GestureHandlerRootView>
    </OdinQueryClient>
  );
};

const navigationContainerRef = createNavigationContainerRef();
const StackRoot = createNativeStackNavigator<AuthStackParamList>();
const RootStack = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useDarkMode();
  const { setRoute } = useRouteContext();

  return (
    <NavigationContainer
      ref={navigationContainerRef}
      theme={isDarkMode ? DarkTheme : DefaultTheme}
      onReady={() => {
        setRoute(navigationContainerRef.getCurrentRoute() || null);
        BootSplash.hide();
      }}
      onStateChange={async () => {
        const currentRouteName = navigationContainerRef.getCurrentRoute() || null;
        setRoute(currentRouteName);
      }}
    >
      <StackRoot.Navigator
        screenOptions={{
          headerShown: false,
          // statusBarColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          /// StatusBarStyle throws error when changin in Ios (even setting to Ui UIControllerbasedStatusBar to yes)
          statusBarStyle: Platform.OS === 'android' ? (isDarkMode ? 'light' : 'dark') : undefined,
          animation: 'slide_from_right',
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
        <WebSocketContextProvider>
          <BubbleColorProvider>
            <ChatSettingsProvider>
              <ErrorBoundary>
                <ExtendPermissionDialog
                  appName={t('Homebase Feed & Chat')}
                  appId={FEED_CHAT_APP_ID}
                  drives={drives}
                  circleDrives={circleDrives}
                  permissions={permissions}
                  // needsAllConnected={true}
                />
                <NotificationToaster />
                <AppStackScreen />
              </ErrorBoundary>
            </ChatSettingsProvider>
          </BubbleColorProvider>
        </WebSocketContextProvider>
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
  useCacheCleanup();

  return <TabStack />;
});

const TabBottom = createBottomTabNavigator<TabStackParamList>();
const TabStack = memo(() => {
  const { isDarkMode } = useDarkMode();

  const rootRoutes = [
    'Home',
    'Feed',
    'Chat',
    'Profile',
    'Posts',
    // ChatStack
    'Conversation',
    'New',
    'NewGroup',
    // ProfileStack
    'Overview',
    'Followers',
    'ConnectionRequests',
    'Appearance',
    'ChatColorSettings',
    'Connections',
    'Following',
    'DriveStatus',
    'ConnectQr',
    'MediaPreview',
  ];
  const { route } = useRouteContext();
  const hide = !route || !rootRoutes.includes(route.name);

  return (
    <BottomSheetModalProvider>
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
          component={FeedStack}
          options={{
            tabBarIcon: TabFeedIcon,
            tabBarStyle: hide
              ? Platform.OS === 'android'
                ? { height: 0, overflow: 'hidden', opacity: 0 }
                : { display: 'none' }
              : { backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100] },
            // lazy: false,
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
          name="Community"
          component={CommunityPage}
          initialParams={{}}
          options={{
            tabBarIcon: TabCommunityIcon,
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
    </BottomSheetModalProvider>
  );
});

export default App;
