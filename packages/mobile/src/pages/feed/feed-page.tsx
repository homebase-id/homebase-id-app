import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback, useEffect, useState } from 'react';
import { TabStackParamList } from '../../app/App';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Keyboard, TouchableOpacity } from 'react-native';
import { Colors } from '../../app/Colors';
import { useRemoveNotifications } from '../../hooks/notifications/usePushNotifications';
import { FEED_APP_ID } from '../../app/constants';
import { PostComposer } from '../../components/Feed/Composer/PostComposer';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Plus } from '../../components/ui/Icons/icons';
import { useIsFocused } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';

import { View } from 'react-native';
import { t } from 'feed-app-common';

import { SocialFeedWebView } from '../../components/Feed/MainContent/SocialFeedWebView';
import { Text } from '../../components/ui/Text/Text';
import SocialFeedMainContent from '../../components/Feed/MainContent/SocialFeed';

type FeedProps = NativeStackScreenProps<TabStackParamList, 'Feed'>;

export const FeedPage = memo((_props: FeedProps) => {
  const netInfo = useNetInfo();

  const [isPostComposerOpen, setIsPostComposerOpen] = useState<boolean>();

  const isFocused = useIsFocused();
  useRemoveNotifications({ disabled: !isFocused, appId: FEED_APP_ID });

  const doCloseComposer = useCallback(() => setIsPostComposerOpen(false), []);
  const doCloseAndRefresh = useCallback(() => {
    setIsPostComposerOpen(false);
    // webviewRef.current?.reload();
  }, []);

  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaView>
      {netInfo.isConnected === false ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Text style={{ textAlign: 'center', paddingHorizontal: 7 }}>
            {t("You're identity can't be reached. Make sure you're online or try again later")}
          </Text>
        </View>
      ) : (
        <BottomSheetModalProvider>
          {/* <SocialFeedWebView /> */}
          <SocialFeedMainContent />

          {!keyboardVisible && (
            <TouchableOpacity
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: Colors.indigo[500],
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                bottom: 20,
                right: 20,
              }}
              onPress={() => setIsPostComposerOpen(true)}
            >
              <Plus color={Colors.white} size="lg" />
            </TouchableOpacity>
          )}

          {isPostComposerOpen && (
            <PostComposer onPost={doCloseAndRefresh} onCancel={doCloseComposer} />
          )}
        </BottomSheetModalProvider>
      )}
    </SafeAreaView>
  );
});
