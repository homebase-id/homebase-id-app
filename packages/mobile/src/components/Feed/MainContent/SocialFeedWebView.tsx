import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../hooks/auth/useAuth';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { uint8ArrayToBase64 } from '@homebase-id/js-lib/helpers';
import { Text } from '../../ui/Text/Text';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import { t } from 'homebase-id-app-common';
import WebView from 'react-native-webview';
import { useErrors } from '../../../hooks/errors/useErrors';
import { Colors } from '../../../app/Colors';

export const SocialFeedWebView = memo(() => {
  const { isDarkMode } = useDarkMode();
  const { authToken, getIdentity, getSharedSecret } = useAuth();
  const identity = getIdentity();

  const sharedSecret = getSharedSecret();
  const base64SharedSecret = sharedSecret ? uint8ArrayToBase64(sharedSecret) : '';

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

  const uri = useMemo(() => `https://${identity}/apps/feed`, [identity]);
  const originWhitelist = useMemo(() => [`https://${identity}`], [identity]);

  const webviewRef = useRef<WebView>(null);
  const add = useErrors().add;
  const [refreshing, setRefreshing] = useState(false);
  const [refresherEnabled, setEnableRefresher] = useState(true);

  //Code to get scroll position
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleScroll = (event: any) => {
    const yOffset = Number(event.nativeEvent.contentOffset.y);
    if (yOffset === 0) {
      setEnableRefresher(true);
    } else if (refresherEnabled) {
      setEnableRefresher(false);
    }
  };

  return (
    <>
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
        </ScrollView>
      ) : null}
    </>
  );
});
