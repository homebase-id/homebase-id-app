import { NavigationProp, useNavigation } from '@react-navigation/native';

import { onlineManager } from '@tanstack/react-query';
import { NativeStackScreenProps, createNativeStackNavigator } from '@react-navigation/native-stack';
import { BackButton, HeaderActions } from '../components/ui/Buttons';
import { useLiveChatProcessor } from '../hooks/chat/useLiveChatProcessor';
import { HeaderBackButtonProps } from '@react-navigation/elements';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';

import { useCallback, useMemo } from 'react';
import { Colors } from './Colors';

// Pages
import { ChatInfoPage } from '../pages/chat/chat-info-page';
import { NewGroupPage } from '../pages/contacts/new-group-page';
import { PreviewMedia } from '../pages/media-preview-page';
import ChatPage from '../pages/chat/chat-page';
import { ConversationsPage } from '../pages/conversations-page';
import EditGroupPage from '../pages/chat/edit-group-page';
import { useDarkMode } from '../hooks/useDarkMode';
import {
  HomebaseFile,
  EmbeddedThumb,
  PayloadDescriptor,
  TargetDrive,
} from '@homebase-id/js-lib/core';
import { ChatMessage } from '../provider/chat/ChatProvider';
import { MessageInfoPage } from '../pages/chat/message-info-page';
import { UnifiedConversation } from '../provider/chat/ConversationProvider';
import { OwnerAvatar } from '../components/ui/Avatars/Avatar';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { SharedItem } from '../hooks/platform/useShareManager';
import { TabStackParamList } from './App';
import { ShareChatPage } from '../pages/chat/share-chat-page';
import { ContactPage } from '../pages/contacts/contact-page';
import { GroupCreationPage } from '../pages/contacts/group-creation-page';
import { DotYouProfile } from '@homebase-id/js-lib/network';
import { ChatFileOverview } from '../components/Files/ChatFileOverview';
import { ImageSource } from '../provider/image/RNImageProvider';

export type ChatStackParamList = {
  Conversation: undefined;
  New: undefined;

  ChatScreen: { convoId: string; initialText?: string };
  ChatInfo: { convoId: string };
  MessageInfo: {
    message: HomebaseFile<ChatMessage>;
    conversation: HomebaseFile<UnifiedConversation>;
  };
  ChatFileOverview: {
    initialAssets: ImageSource[];
    recipients: HomebaseFile<UnifiedConversation>[];
  };
  EditGroup: { convoId: string };
  ShareChat: SharedItem[];
  PreviewMedia: {
    fileId: string;
    globalTransitId?: string;
    targetDrive: TargetDrive;
    payloads: PayloadDescriptor[];
    currIndex: number;
    previewThumbnail?: EmbeddedThumb;
    senderOdinId?: string;
    createdAt?: number;
    probablyEncrypted?: boolean;
    transitOdinId?: string;
  };
};

export type NewChatStackParamList = {
  NewChat: undefined;
  NewGroup: undefined;
  CreateGroup: {
    recipients: DotYouProfile[];
  };
};

const NewChatStack = createNativeStackNavigator<NewChatStackParamList>();
export const NewChatStackScreen = (_props: NativeStackScreenProps<ChatStackParamList, 'New'>) => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  const { isDarkMode } = useDarkMode();

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
    <NewChatStack.Navigator
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: 'regular',
        headerTintColor: isDarkMode ? Colors.white : Colors.black,
        headerStyle: {
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        },
      }}
    >
      <NewChatStack.Screen
        name="NewChat"
        component={ContactPage}
        options={{
          headerShown: true,
          headerTitle: 'New Message',
          headerLeft: Platform.OS === 'ios' ? headerBackButton : undefined,
        }}
      />
      <NewChatStack.Screen
        name="NewGroup"
        component={NewGroupPage}
        options={{
          headerTitle: 'New Group',
          headerShown: false,
        }}
      />
      <NewChatStack.Screen
        name="CreateGroup"
        component={GroupCreationPage}
        options={{
          headerTitle: 'Name Group',
          headerShown: false,
        }}
      />
    </NewChatStack.Navigator>
  );
};

const StackChat = createNativeStackNavigator<ChatStackParamList>();
export const ChatStack = (_props: NativeStackScreenProps<TabStackParamList, 'Chat'>) => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  const isOnline = useLiveChatProcessor();
  const { isDarkMode } = useDarkMode();
  const screenOptions = useMemo(
    () =>
      ({
        headerShown: false,
        statusBarColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        /// StatusBarStyle throws error when changin in Ios (even setting to Ui UIControllerbasedStatusBar to yes)
        statusBarStyle: Platform.OS === 'android' ? (isDarkMode ? 'light' : 'dark') : undefined,
        headerShadowVisible: false,
        headerTransparent: Platform.OS === 'ios',
        headerBlurEffect: 'regular',
        headerTintColor: isDarkMode ? Colors.white : Colors.black,
        headerStyle: {
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        },
        headerBackButtonMenuEnabled: false,
        headerBackTitleVisible: false,
      }) as NativeStackNavigationOptions,
    [isDarkMode]
  );
  const headerRight = useCallback(() => {
    return HeaderActions({
      onPress: () => navigation.navigate('New'),
    });
  }, [navigation]);

  return (
    <StackChat.Navigator screenOptions={screenOptions}>
      <StackChat.Screen
        name="Conversation"
        component={ConversationsPage}
        options={{
          title: 'Chats',
          headerShown: true,
          headerTitleAlign: 'left',
          headerLeft: isOnline ? ProfileAvatar : OfflineProfileAvatar,
          headerRight: Platform.OS === 'ios' ? headerRight : undefined,
          headerSearchBarOptions: {
            shouldShowHintSearchIcon: true,
            hideWhenScrolling: true,
            placeholder: 'Search',
            hideNavigationBar: true,
          },
        }}
      />
      <StackChat.Screen
        name="ChatFileOverview"
        component={ChatFileOverview}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <StackChat.Group
        screenOptions={{
          presentation: 'modal',
        }}
      >
        <StackChat.Screen name="New" component={NewChatStackScreen} />
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
        name="ShareChat"
        component={ShareChatPage}
        options={{
          headerShown: true,
          gestureEnabled: true,
          title: 'Share',
        }}
      />
      <StackChat.Screen
        name="PreviewMedia"
        component={PreviewMedia}
        options={{
          headerShown: true,
          title: '',
          headerBackTitleVisible: false,
          headerShadowVisible: false,
          headerTransparent: true,
          animation: 'fade_from_bottom',
          headerTintColor: Colors.white,
        }}
      />
      <StackChat.Screen
        name="ChatInfo"
        component={ChatInfoPage}
        options={{
          gestureEnabled: true,
          headerTitle: '',
          headerShown: false,
        }}
      />
      <StackChat.Screen
        name="MessageInfo"
        component={MessageInfoPage}
        options={{
          gestureEnabled: true,
          headerTitle: 'Message Info',
          headerShown: true,
        }}
      />
      <StackChat.Screen
        name="EditGroup"
        component={EditGroupPage}
        options={{
          gestureEnabled: true,
          headerTitle: 'Edit Group',
          headerShown: false,
        }}
      />
    </StackChat.Navigator>
  );
};

export const ProfileAvatar = () => {
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

export const OfflineProfileAvatar = () => {
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
