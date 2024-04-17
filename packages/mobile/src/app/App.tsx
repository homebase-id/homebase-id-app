import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigationProp,
  createNavigationContainerRef,
  useNavigation,
} from '@react-navigation/native';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import {
  PersistQueryClientProvider,
  PersistQueryClientOptions,
} from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps, createNativeStackNavigator } from '@react-navigation/native-stack';
import CodePush from 'react-native-code-push';
import { useAuth, useValidTokenCheck } from '../hooks/auth/useAuth';
import { DotYouClientProvider } from '../components/Auth/DotYouClientProvider';
import { BackButton, HeaderActions } from '../components/ui/convo-app-bar';
import { useLiveChatProcessor } from '../hooks/chat/useLiveChatProcessor';
import { HeaderBackButtonProps } from '@react-navigation/elements';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { memo, useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from './Colors';

// Pages
import { ChatInfoPage } from '../pages/chat/chat-info-page';
import { ConnectionsPage } from '../pages/profile/connections-page';
import { ContactPage } from '../pages/contact-page';
import { FeedPage } from '../pages/feed/feed-page';
import { FollowersPage } from '../pages/profile/followers-page';
import { FollowingPage } from '../pages/profile/following-page';
import { HomePage } from '../pages/home/home-page';
import { LoginPage } from '../pages/login/login-page';
import { NewGroupPage } from '../pages/new-group-page';
import { PreviewMedia } from '../pages/media-preview-page';
import { ProfilePage } from '../pages/profile/profile-page';
import ChatPage from '../pages/chat/chat-page';
import { ConversationsPage } from '../pages/conversations-page';
import EditGroupPage from '../pages/chat/edit-group-page';
import { ConnectionRequestsPage } from '../pages/home/connection-requests-page';
import { useDarkMode } from '../hooks/useDarkMode';
import { HomebaseFile, EmbeddedThumb } from '@youfoundation/js-lib/core';
import { ChatMessage } from '../provider/chat/ChatProvider';
import { useRefetchOnFocus } from '../hooks/platform/useRefetchOnFocus';
import { useOnlineManager } from '../hooks/platform/useOnlineManager';
import { PushNotificationProvider } from '../components/push-notification/PushNotificationProvider';
import { useAuthenticatedPushNotification } from '../hooks/push-notification/useAuthenticatedPushNotification';
import Toast from 'react-native-toast-message';
import { ErrorToaster } from '../components/ui/Alert/ErrorToaster';
import { MessageInfoPage } from '../pages/chat/message-info-page';
import { Conversation } from '../provider/chat/ConversationProvider';
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
import { OwnerAvatar } from '../components/ui/Avatars/Avatar';

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

export type ProfileStackParamList = {
  Overview: undefined;
  Followers: undefined;
  ConnectionRequests: undefined;
  Connections: undefined;
  Following: undefined;
};

export type ChatStackParamList = {
  Conversation: undefined;
  NewChat: undefined;
  NewGroup: undefined;

  ChatScreen: { convoId: string };
  ChatInfo: { convoId: string };
  MessageInfo: {
    message: HomebaseFile<ChatMessage>;
    conversation: HomebaseFile<Conversation>;
  };
  EditGroup: { convoId: string };
  PreviewMedia: {
    msg: HomebaseFile<ChatMessage>;
    fileId: string;
    payloadKey: string;
    currIndex: number;
    type?: string;
    previewThumbnail?: EmbeddedThumb;
  };
};

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      gcTime: Infinity,
      retry: 0,
    },
    queries: {
      retry: 2,
      gcTime: Infinity,
    },
  },
});

const asyncPersist = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

// Explicit includes to avoid persisting media items, or large data in general
const INCLUDED_QUERY_KEYS = [
  'chat-message',
  'chat-messages',
  'conversations',
  'chat-reaction',
  'connection-details',
  'contact',
  'profile-data',
  'followers',
  'following',
  'active-connections',
  'pending-connections',

  // Small data (blobs to local file Uri)
  'image',

  // Big data (base64 uri's)
  // 'tinyThumb',

  'processInbox',
];
const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  buster: '202404_4',
  maxAge: Infinity,
  persister: asyncPersist,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      if (
        query.state.status === 'pending' ||
        query.state.status === 'error' ||
        (query.state.data &&
          typeof query.state.data === 'object' &&
          !Array.isArray(query.state.data) &&
          Object.keys(query.state.data).length === 0)
      ) {
        return false;
      }
      const { queryKey } = query;
      return INCLUDED_QUERY_KEYS.some((key) => queryKey.includes(key));
    },
  },
};

let App = () => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={() => queryClient.resumePausedMutations()}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PushNotificationProvider>
          <RouteContextProvider>
            <RootStack />
            <Toast />
          </RouteContextProvider>
        </PushNotificationProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
};

const codePushOptions = { checkFrequency: CodePush.CheckFrequency.MANUAL };
App = CodePush(codePushOptions)(App);

const ref = createNavigationContainerRef();
const StackRoot = createNativeStackNavigator<AuthStackParamList>();
const RootStack = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useDarkMode();
  const { setRouteName } = useRouteContext();

  return (
    <NavigationContainer
      ref={ref}
      theme={isDarkMode ? DarkTheme : DefaultTheme}
      onReady={() => {
        setRouteName(ref.getCurrentRoute()?.name || null);
      }}
      onStateChange={async () => {
        const currentRouteName = ref.getCurrentRoute()?.name || null;
        setRouteName(currentRouteName);
      }}
    >
      <StackRoot.Navigator screenOptions={{ headerShown: false }}>
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
      <StackProfile.Screen name="ConnectionRequests" component={ConnectionRequestsPage} />
      <StackProfile.Screen name="Connections" component={ConnectionsPage} />
      <StackProfile.Screen name="Following" component={FollowingPage} />
    </StackProfile.Navigator>
  );
};

const StackChat = createNativeStackNavigator<ChatStackParamList>();
const ChatStack = (_props: NativeStackScreenProps<TabStackParamList, 'Chat'>) => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  const isOnline = useLiveChatProcessor();
  const { isDarkMode } = useDarkMode();
  const backgroundColor = useMemo(() => (isDarkMode ? Colors.black : Colors.white), [isDarkMode]);
  const headerRight = useCallback(() => {
    return HeaderActions({
      onPress: () => navigation.navigate('NewChat'),
    });
  }, [navigation]);

  const headerBackButton = useCallback(
    (props: HeaderBackButtonProps) => {
      return BackButton({
        onPress: () => navigation.navigate('Conversation'),
        prop: props,
      });
    },
    [navigation]
  );

  return (
    <StackChat.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <StackChat.Screen
        name="Conversation"
        component={ConversationsPage}
        options={{
          title: 'Chats',
          headerShown: true,
          headerTitleAlign: 'left',
          headerLeft: isOnline ? ProfileAvatar : OfflineProfileAvatar,
          headerRight: headerRight,
          contentStyle: {
            backgroundColor: backgroundColor,
          },
          headerStyle: {
            backgroundColor: backgroundColor,
          },
          headerShadowVisible: Platform.OS === 'android',
          headerTransparent: Platform.OS === 'ios',
          headerBlurEffect: 'regular',
          headerSearchBarOptions: {
            shouldShowHintSearchIcon: true,
            hideWhenScrolling: true,
            placeholder: 'Search',
            hideNavigationBar: true,
          },
        }}
      />

      <StackChat.Group screenOptions={{ presentation: 'modal' }}>
        {/* TODO: Swiping effect like signal  */}
        <StackChat.Screen
          name="NewChat"
          component={ContactPage}
          options={{
            headerShown: true,
            headerTitle: 'New Message',
            headerLeft: Platform.OS === 'ios' ? headerBackButton : undefined,
          }}
        />
        <StackChat.Screen
          name="NewGroup"
          component={NewGroupPage}
          options={{
            headerTitle: 'New Group',
            headerShown: false,
            headerLeft: headerBackButton,
          }}
        />
      </StackChat.Group>

      <StackChat.Screen
        name="ChatScreen"
        // component={(props) => <ChatPage {...props} />} // This is faster, but react-navigation goes crazy with warnings
        component={ChatPage}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <StackChat.Screen
        name="PreviewMedia"
        component={PreviewMedia}
        options={{
          headerShown: true,
          gestureEnabled: true,
          title: '',
          headerBackTitleVisible: false,

          headerTransparent: true,
        }}
      />
      <StackChat.Screen
        name="ChatInfo"
        component={ChatInfoPage}
        options={{
          gestureEnabled: true,
          headerTitle: 'Chat Info',
          headerBackTitleVisible: false,
          headerShown: false,
        }}
      />
      <StackChat.Screen
        name="MessageInfo"
        component={MessageInfoPage}
        options={{
          gestureEnabled: true,
          headerTitle: 'Message Info',
          headerBackTitleVisible: false,
          headerShown: true,
        }}
      />
      <StackChat.Screen
        name="EditGroup"
        component={EditGroupPage}
        options={{
          gestureEnabled: true,
          headerTitle: 'Edit Group',
          headerBackTitleVisible: false,
          headerShown: false,
        }}
      />
    </StackChat.Navigator>
  );
};

const ProfileAvatar = () => {
  const { isDarkMode } = useDarkMode();
  const onlineDotStyle: StyleProp<ViewStyle> = useMemo(
    () => ({
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: !isDarkMode ? Colors.white : Colors.black,
      borderWidth: 1,
      borderColor: Colors.slate[200],
      position: 'absolute',
      bottom: 0,
      right: 0,
      zIndex: 15,
    }),
    [isDarkMode]
  );

  return (
    <View style={{ marginRight: Platform.OS === 'android' ? 16 : 0, position: 'relative' }}>
      <OwnerAvatar imageSize={{ width: 30, height: 30 }} style={{ borderRadius: 30 / 2 }} />
      <View
        style={[
          onlineDotStyle,
          onlineManager.isOnline()
            ? {
                backgroundColor: Colors.green[500],
              }
            : {},
        ]}
      />
    </View>
  );
};

const OfflineProfileAvatar = () => {
  const { isDarkMode } = useDarkMode();
  const offlineDotStyle: StyleProp<ViewStyle> = useMemo(
    () => ({
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: !isDarkMode ? Colors.white : Colors.black,
      borderWidth: 1,
      borderColor: Colors.slate[200],
      position: 'absolute',
      bottom: 0,
      right: 0,
      zIndex: 15,
    }),
    [isDarkMode]
  );

  return (
    <View style={{ marginRight: Platform.OS === 'android' ? 16 : 0, position: 'relative' }}>
      <OwnerAvatar imageSize={{ width: 30, height: 30 }} style={{ borderRadius: 30 / 2 }} />
      <View
        style={[
          offlineDotStyle,
          onlineManager.isOnline()
            ? {
                backgroundColor: Colors.red[500],
              }
            : {},
        ]}
      />
    </View>
  );
};

export default App;
