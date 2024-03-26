import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigationProp,
  useNavigation,
} from '@react-navigation/native';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
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
import { Platform, useColorScheme } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCallback } from 'react';
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
import ConversationPage from '../pages/conversation-page';
import EditGroupPage from '../pages/chat/edit-group-page';
import { ConnectionRequestsPage } from '../pages/home/connection-requests-page';
import { useDarkMode } from '../hooks/useDarkMode';
import { HomebaseFile, EmbeddedThumb } from '@youfoundation/js-lib/core';
import { OdinImage } from '../components/ui/OdinImage/OdinImage';
import { BuiltInProfiles, GetTargetDriveFromProfileId } from '@youfoundation/js-lib/profile';
import { useProfile } from '../hooks/profile/useProfile';
import { ChatMessage } from '../provider/chat/ChatProvider';
import { useRefreshOnFocus } from '../hooks/chat/useRefetchOnFocus';
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
  Connections: undefined;
  Following: undefined;
};

export type ChatStackParamList = {
  Conversation: undefined;
  NewChat: undefined;
  NewGroup: undefined;
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
  'conversation',
  'conversations',
  'chat-reaction',
  'connectionDetails',

  // Small data (blobs to local file Uri)
  'image',

  // Big data (base64 uri's)
  // 'tinyThumb',
];
const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  buster: '202403',
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
      onSuccess={() =>
        queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries())
      }
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootStack />
        <Toast />
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
};

const codePushOptions = { checkFrequency: CodePush.CheckFrequency.MANUAL };
App = CodePush(codePushOptions)(App);

const StackRoot = createNativeStackNavigator<AuthStackParamList>();
const RootStack = () => {
  const { isAuthenticated } = useAuth();
  const scheme = useColorScheme();

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
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

const AuthenticatedRoot = () => {
  return (
    <DotYouClientProvider>
      <AppStackScreen />
    </DotYouClientProvider>
  );
};

export type AppStackParamList = {
  TabStack: undefined;
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

const AppStack = createNativeStackNavigator<AppStackParamList>();
const AppStackScreen = () => {
  useValidTokenCheck();
  useRefreshOnFocus();
  useLiveChatProcessor();

  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AppStack.Screen name="TabStack" component={TabStack} />
      <AppStack.Screen
        name="ChatScreen"
        component={ChatPage}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <AppStack.Screen
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
      <AppStack.Screen
        name="ChatInfo"
        component={ChatInfoPage}
        options={{
          gestureEnabled: true,
          headerTitle: 'Chat Info',
          headerBackTitleVisible: false,
          headerShown: false,
        }}
      />
      <AppStack.Screen
        name="MessageInfo"
        component={MessageInfoPage}
        options={{
          gestureEnabled: true,
          headerTitle: 'Message Info',
          headerBackTitleVisible: false,
          headerShown: true,
        }}
      />
      <AppStack.Screen
        name="EditGroup"
        component={EditGroupPage}
        options={{
          gestureEnabled: true,
          headerTitle: 'Edit Group',
          headerBackTitleVisible: false,
          headerShown: false,
        }}
      />
    </AppStack.Navigator>
  );
};

const TabBottom = createBottomTabNavigator<TabStackParamList>();
const TabStack = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <TabBottom.Navigator
      screenOptions={{
        headerShown: false,
        tabBarInactiveTintColor: isDarkMode ? Colors.white : Colors.black,
        tabBarActiveTintColor: isDarkMode ? Colors.white : Colors.black,
        tabBarActiveBackgroundColor: isDarkMode ? Colors.indigo[700] : Colors.indigo[200],
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100],
        },
      }}
      initialRouteName="Chat"
    >
      <TabBottom.Screen
        name="Home"
        component={HomeStack}
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
};

const StackHome = createNativeStackNavigator<HomeStackParamList>();
const HomeStack = () => {
  return (
    <StackHome.Navigator>
      <StackHome.Screen
        name="Overview"
        component={HomePage}
        options={{
          headerShown: false,
        }}
      />
      <StackHome.Screen
        name="ConnectionRequests"
        component={ConnectionRequestsPage}
        options={{
          headerTitle: 'Connection requests',
          headerBackTitle: 'Home',
        }}
      />
    </StackHome.Navigator>
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

const StackChat = createNativeStackNavigator<ChatStackParamList>();
const ChatStack = (_props: NativeStackScreenProps<TabStackParamList, 'Chat'>) => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

  const headerRight = useCallback(() => {
    return HeaderActions({
      onPress: () => navigation.navigate('NewChat'),
    });
  }, [navigation]);

  return (
    <StackChat.Navigator>
      <StackChat.Screen
        name="Conversation"
        component={ConversationPage}
        options={{
          title: 'Chats',
          headerShown: true,
          headerTitleAlign: 'left',
          headerLeft: ProfileAvatar,
          headerRight: headerRight,
        }}
      />

      <StackChat.Group screenOptions={{ presentation: 'modal' }}>
        {/* TODO: Swiping effect like signal  */}
        <StackChat.Screen
          name="NewChat"
          component={ContactPage}
          options={{
            headerTitle: 'New Message',
            headerLeft:
              Platform.OS === 'ios'
                ? (props: HeaderBackButtonProps) => {
                    return BackButton({
                      onPress: () => navigation.navigate('Conversation'),
                      prop: props,
                    });
                  }
                : undefined,
          }}
        />
        <StackChat.Screen
          name="NewGroup"
          component={NewGroupPage}
          options={{
            headerTitle: 'New Group',
            headerShown: false,
            headerLeft: (props: HeaderBackButtonProps) => {
              return BackButton({
                onPress: () => navigation.navigate('Conversation'),
                prop: props,
                label: '',
              });
            },
          }}
        />
      </StackChat.Group>
    </StackChat.Navigator>
  );
};

const ProfileAvatar = () => {
  const { data: profile } = useProfile();
  return (
    <OdinImage
      fit="cover"
      targetDrive={GetTargetDriveFromProfileId(BuiltInProfiles.StandardProfileId)}
      fileId={profile?.profileImageFileId}
      fileKey={profile?.profileImageFileKey}
      imageSize={{ width: 30, height: 30 }}
      style={{ borderRadius: 30 / 2, marginRight: Platform.OS === 'android' ? 10 : 0 }}
    />
  );
};

export default App;
