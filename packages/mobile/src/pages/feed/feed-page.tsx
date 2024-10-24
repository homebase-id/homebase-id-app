import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback, useMemo } from 'react';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Platform, TouchableHighlight } from 'react-native';
import { Colors } from '../../app/Colors';
import { useRemoveNotifications } from '../../hooks/notifications/usePushNotifications';
import { FEED_APP_ID } from '../../app/constants';
import { Feed, Plus } from '../../components/ui/Icons/icons';
import { NavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import SocialFeedMainContent from '../../components/Feed/MainContent/SocialFeed';
import { FeedStackParamList } from '../../app/FeedStack';
import { useLiveFeedProcessor } from '../../hooks/feed/useSocialFeed';
import { Header } from '@react-navigation/elements';
import { OfflineProfileAvatar, ProfileAvatar } from '../../app/ChatStack';
import { View } from 'react-native';
import { Text } from '../../components/ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import { OfflineState } from '../../components/Platform/OfflineState';

type FeedProps = NativeStackScreenProps<FeedStackParamList, 'Posts'>;

export const FeedPage = memo((_: FeedProps) => {
  const isFocused = useIsFocused();
  useRemoveNotifications({ disabled: !isFocused, appId: FEED_APP_ID });

  return (
    <SafeAreaView>
      {/* <SocialFeedWebView /> */}
      <FeedHeader />
      <OfflineState />
      <SocialFeedMainContent />

      <FloatingActionButton />
    </SafeAreaView>
  );
});

const FloatingActionButton = memo(() => {
  const { isDarkMode } = useDarkMode();
  const backgroundColor = useMemo(
    () => (isDarkMode ? Colors.indigo[500] : Colors.indigo[200]),
    [isDarkMode]
  );
  const navigation = useNavigation<NavigationProp<FeedStackParamList>>();
  const onPress = useCallback(() => {
    navigation.navigate('Compose');
  }, [navigation]);

  return (
    <TouchableHighlight
      onPress={onPress}
      style={{
        position: 'absolute',
        bottom: 32,
        right: 12,
        padding: 16,
        borderRadius: Platform.select({ ios: 25, android: 15 }),
        backgroundColor: backgroundColor,
        zIndex: 100,
      }}
      underlayColor={Colors.indigo[300]}
    >
      <Plus size={'md'} />
    </TouchableHighlight>
  );
});

export const FeedHeader = memo(() => {
  const isOnline = useLiveFeedProcessor();

  const headerTitle = useCallback(
    () => (
      <View style={{ flexDirection: 'row', alignContent: 'center', alignItems: 'center', gap: 12 }}>
        <Feed size={'lg'} />
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
          }}
        >
          Feed
        </Text>
      </View>
    ),
    []
  );

  return (
    <Header
      title="Homebase Feed"
      headerTitleAlign="left"
      headerTitle={headerTitle}
      headerRight={isOnline ? ProfileAvatar : OfflineProfileAvatar}
      headerRightContainerStyle={{ paddingRight: 16 }}
      headerTransparent
      headerStatusBarHeight={0}
    />
  );
});
