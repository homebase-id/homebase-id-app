import { EmbeddedThumb, PayloadDescriptor, TargetDrive } from '@homebase-id/js-lib/core';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { TabStackParamList } from './App';
import { useDarkMode } from '../hooks/useDarkMode';
import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { Colors } from './Colors';
import { FeedPage } from '../pages/feed/feed-page';
import { PreviewMedia } from '../pages/media-preview-page';
import { ComposePost } from '../pages/feed/post-composer';
import { PostDetailPage } from '../pages/feed/post-detail-page';
import { BackButton } from '../components/ui/Buttons';

export type FeedStackParamList = {
  Posts:
    | {
        postKey?: string;
      }
    | undefined;
  Post: {
    postKey: string;
    channelKey?: string;
    odinId?: string;
  };
  Compose: undefined;
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

const StackFeed = createNativeStackNavigator<FeedStackParamList>();
export const FeedStack = ({ navigation }: NativeStackScreenProps<TabStackParamList, 'Feed'>) => {
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

  const backButton = useCallback(
    () => (
      <BackButton
        label=" "
        showArrow
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
          return navigation.navigate('Feed', { screen: 'Posts' });
        }}
      />
    ),
    [navigation]
  );

  return (
    <StackFeed.Navigator screenOptions={screenOptions}>
      <StackFeed.Screen name="Posts" component={FeedPage} />
      <StackFeed.Screen
        name="PreviewMedia"
        component={PreviewMedia}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <StackFeed.Screen
        name="Compose"
        component={ComposePost}
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <StackFeed.Screen
        name="Post"
        component={PostDetailPage}
        options={{
          headerShown: true,
          animation: 'slide_from_right',
          headerLeft: backButton,
        }}
      />
    </StackFeed.Navigator>
  );
};
