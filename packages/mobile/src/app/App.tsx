import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigationProp,
  useNavigation,
} from '@react-navigation/native';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfilePage from '../pages/profile-page';
import { NativeStackScreenProps, createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginPage from '../pages/login-page';
import FeedPage from '../pages/feed-page';
import CodePush from 'react-native-code-push';
import { useAuth, useValidTokenCheck } from '../hooks/auth/useAuth';
import FollowersPage from '../pages/profile/followers-page';
import ConnectionsPage from '../pages/profile/connections-page';
import FollowingPage from '../pages/profile/following-page';
import { DotYouClientProvider } from '../components/Auth/DotYouClientProvider';
import ConversationPage from '../pages/conversation-page';
import { BackButton, HeaderActions } from '../components/ui/convo-app-bar';
import { useLiveChatProcessor } from '../hooks/chat/useLiveChatProcessor';
import ChatPage from '../pages/chat-page';
import EditGroupPage from '../pages/edit-group-page';
import { HeaderBackButton, HeaderBackButtonProps } from '@react-navigation/elements';
import { Platform, useColorScheme } from 'react-native';
import { ChatInfoPage } from '../pages/chat-info-page';
import { ContactPage } from '../pages/contact-page';
import { NewGroupPage } from '../pages/new-group-page';

import { PreviewMedia } from '../pages/media-preview-page';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { EmbeddedThumb } from '@youfoundation/js-lib/core';

export type AuthStackParamList = {
  Login: undefined;
  Authenticated: undefined;
};

export type TabStackParamList = {
  Feed: undefined;
  Profile: undefined;
  Chat: undefined;
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

export type ChatStackParamList = {
  Conversation: undefined;
  ChatScreen: { convoId: string };
  NewChat: undefined;
  NewGroup: undefined;
  PreviewMedia: {
    fileId: string;
    payloadKey: string;
    type?: string;
    previewThumbnail?: EmbeddedThumb;
  };
  ChatInfo: { convoId: string };
  EditGroup: { convoId: string };
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootStack />
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
  useLiveChatProcessor();
  return (
    <StackTab.Navigator screenOptions={{ headerShown: false }}>
      <StackTab.Screen name="Feed" component={FeedPage} />
      <StackTab.Screen name="Profile" component={ProfileStack} />
      <StackTab.Screen name="Chat" component={ChatStack} />
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

const StackChat = createNativeStackNavigator<ChatStackParamList>();
const ChatStack = ({ navigation: nav }: NativeStackScreenProps<TabStackParamList, 'Chat'>) => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  return (
    <StackChat.Navigator>
      <StackChat.Screen
        name="Conversation"
        component={ConversationPage}
        options={{
          title: 'Chats',
          // headerStyle: {
          //   height: Platform.OS === 'ios' ? 112 : 60,
          // },
          headerShown: true,
          headerTitleAlign: 'left',
          headerLeft: (prop) => (
            <HeaderBackButton
              {...prop}
              canGoBack
              labelVisible={false}
              onPress={() => nav.goBack()}
            />
          ),
          headerRight: () =>
            HeaderActions({
              onPress: () => navigation.navigate('NewChat'),
            }),
        }}
      />
      <StackChat.Screen
        name="ChatScreen"
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
          // headerShown: false,
          gestureEnabled: true,
          title: '',
          headerBackTitleVisible: false,

          headerTransparent: true,
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
                      onPress: () => nav.goBack(),
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
                onPress: () => nav.goBack(),
                prop: props,
                label: '',
              });
            },
          }}
        />
      </StackChat.Group>
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

export type SettingsStackParamList = {
  Profile: undefined;
};

export default App;
