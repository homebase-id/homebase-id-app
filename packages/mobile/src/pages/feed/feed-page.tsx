import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TabStackParamList } from '../../app/App';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import WebView from 'react-native-webview';
import { uint8ArrayToBase64 } from '@youfoundation/js-lib/helpers';
import { Keyboard, Linking, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/auth/useAuth';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ScrollView } from 'react-native-gesture-handler';
import { useRemoveNotifications } from '../../hooks/notifications/usePushNotifications';
import { FEED_APP_ID } from '../../app/constants';
import { PostComposer } from '../../components/Feed/Composer/PostComposer';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Plus } from '../../components/ui/Icons/icons';
import { useIsFocused } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';

import { Text, View } from 'react-native';
import { t } from 'feed-app-common';
import { useErrors } from '../../hooks/errors/useErrors';

type FeedProps = NativeStackScreenProps<TabStackParamList, 'Feed'>;

export const FeedPage = memo((_props: FeedProps) => {
  const netInfo = useNetInfo();

  const { isDarkMode } = useDarkMode();
  const { authToken, getIdentity, getSharedSecret } = useAuth();
  const identity = getIdentity();

  const [isPostComposerOpen, setIsPostComposerOpen] = useState<boolean>();

  const isFocused = useIsFocused();
  useRemoveNotifications({ disabled: !isFocused, appId: FEED_APP_ID });

  const sharedSecret = getSharedSecret();
  const base64SharedSecret = sharedSecret ? uint8ArrayToBase64(sharedSecret) : '';

  const uri = useMemo(() => `https://${identity}/apps/feed`, [identity]);
  const originWhitelist = useMemo(() => [`https://${identity}`], [identity]);

  const INJECTED_JAVASCRIPT = useMemo(() => {
    return `(function() {
        const APP_SHARED_SECRET_KEY = 'APPS_feed';
        const APP_AUTH_TOKEN_KEY = 'BX0900_feed';
        // const IDENTITY_KEY = 'identity';
        const APP_CLIENT_TYPE_KEY = 'client_type';
        const PREFERS_DARK_MODE = 'prefersDark'

        const APP_SHARED_SECRET = '${base64SharedSecret}';
        const APP_AUTH_TOKEN = '${authToken}';
        // const IDENTITY = '${identity}';
        const APP_CLIENT_TYPE = 'react-native-v2';

        window.localStorage.setItem(APP_SHARED_SECRET_KEY, APP_SHARED_SECRET);
        window.localStorage.setItem(APP_AUTH_TOKEN_KEY, APP_AUTH_TOKEN);
        // window.localStorage.setItem(IDENTITY_KEY, IDENTITY);
        window.localStorage.setItem(APP_CLIENT_TYPE_KEY, APP_CLIENT_TYPE);
        window.localStorage.setItem(PREFERS_DARK_MODE, '${isDarkMode ? '1' : '0'}');
      })();`;
  }, [authToken, base64SharedSecret, identity, isDarkMode]);

  const [refreshing, setRefreshing] = useState(false);
  const [refresherEnabled, setEnableRefresher] = useState(true);
  const webviewRef = useRef<WebView>(null);
  const add = useErrors().add;

  //Code to get scroll position
  const handleScroll = (event: any) => {
    const yOffset = Number(event.nativeEvent.contentOffset.y);
    if (yOffset === 0) {
      setEnableRefresher(true);
    } else if (refresherEnabled) {
      setEnableRefresher(false);
    }
  };

  const doCloseComposer = useCallback(() => setIsPostComposerOpen(false), []);
  const doCloseAndRefresh = useCallback(() => {
    setIsPostComposerOpen(false);
    webviewRef.current?.reload();
  }, []);

  const renderError = useCallback(
    (errorDomain: string | undefined, errorCode: number, errorDesc: string) => {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Text style={{ textAlign: 'center', paddingHorizontal: 7 }}>
            {t('An error occurred while loading the feed. Please try again later.')}
            {'\n'}
            {t('Error Domain')}: {errorDomain}
            {'\n'}
            {t('Error Code')}: {errorCode}
            {'\n'}
            {t('Error Description')}: {errorDesc}
          </Text>
        </View>
      );
    },
    []
  );

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
          {identity && uri ? (
            <ScrollView
              contentContainerStyle={{ flex: 1 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  enabled={refresherEnabled}
                  onRefresh={() => webviewRef.current?.reload()}
                />
              }
            >
              <WebView
                ref={webviewRef}
                source={{ uri }}
                injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
                pullToRefreshEnabled={true}
                style={{ backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[50] }}
                originWhitelist={originWhitelist} // Keeps the WebView from navigating away from the feed-app; Any links that don't match will be opened by the system.. Eg: open in the browser
                onScroll={handleScroll}
                onLoadEnd={() => setRefreshing(false)}
                forceDarkOn={isDarkMode}
                onError={(error) => {
                  add(error);
                }}
                renderError={renderError}
                allowsBackForwardNavigationGestures={true}
                onNavigationStateChange={(navState) => {
                  const targetUrl = navState.url;
                  const shouldMoveToNewWindow = !targetUrl.startsWith(uri);
                  if (targetUrl && shouldMoveToNewWindow) {
                    // Disable loading any page that is not part of the feed-app; And open it in the browser
                    webviewRef.current?.stopLoading();
                    webviewRef.current?.goBack();
                    Linking.openURL(targetUrl);
                  }
                }}
              />
              {!keyboardVisible ? (
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
              ) : null}
            </ScrollView>
          ) : null}

          {isPostComposerOpen ? (
            <PostComposer onPost={doCloseAndRefresh} onCancel={doCloseComposer} />
          ) : null}
        </BottomSheetModalProvider>
      )}
    </SafeAreaView>
  );
});
