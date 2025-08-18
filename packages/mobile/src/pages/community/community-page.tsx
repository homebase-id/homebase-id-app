import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import WebView from 'react-native-webview';
import { uint8ArrayToBase64 } from '@homebase-id/js-lib/helpers';
import { useAuth } from '../../hooks/auth/useAuth';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useRemoveNotifications } from '../../hooks/notifications/usePushNotifications';
import { COMMUNITY_APP_ID } from '../../app/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebViewNavigationEvent } from 'react-native-webview/lib/WebViewTypes';

import { TabStackParamList } from '../../app/App';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

type CommunityProps = NativeStackScreenProps<TabStackParamList, 'Community'>;

export const CommunityPage = memo((_props: CommunityProps) => {
  const { isDarkMode } = useDarkMode();
  const { authToken, getIdentity, getSharedSecret } = useAuth();
  const identity = getIdentity();
  const [isLoading, setIsLoading] = useState(true);

  const { typeId, tagId } = _props.route.params;

  useRemoveNotifications({ appId: COMMUNITY_APP_ID });
  const { top, bottom } = useSafeAreaInsets();

  const sharedSecret = getSharedSecret();
  const base64SharedSecret = sharedSecret ? uint8ArrayToBase64(sharedSecret) : '';

  // const [_, setIndex] = useState(0); // Used to force the WebView to reload when the component is focused

  // useFocusEffect(
  //   useCallback(() => {
  //     setIndex((prevIndex) => prevIndex + 1);
  //   }, [])
  // );

  const uri = useMemo(
    () =>
      typeId || tagId
        ? `https://${identity}/apps/community/redirect/${typeId}/${tagId}?prefersDark=${isDarkMode ? '1' : '0'}`
        : `https://${identity}/apps/community?prefersDark=${isDarkMode ? '1' : '0'}`,
    [typeId, tagId, identity, isDarkMode]
  );
  const originWhitelist = useMemo(() => [`https://${identity}`], [identity]);

  const INJECTED_JAVASCRIPT = useMemo(() => {
    return `(function() {
        const APP_SHARED_SECRET_KEY = 'APPS_community';
        const APP_AUTH_TOKEN_KEY = 'BX0900_community';
        const IDENTITY_KEY = 'identity';
        const APP_CLIENT_TYPE_KEY = 'client_type';
        const PREFERS_DARK_MODE = 'prefersDark'

        const APP_SHARED_SECRET = '${base64SharedSecret}';
        const APP_AUTH_TOKEN = '${authToken}';
        const IDENTITY = '${identity}';
        const APP_CLIENT_TYPE = 'react-native';

        window.localStorage.setItem(APP_SHARED_SECRET_KEY, APP_SHARED_SECRET);
        window.localStorage.setItem(APP_AUTH_TOKEN_KEY, APP_AUTH_TOKEN);
        window.localStorage.setItem(IDENTITY_KEY, IDENTITY);
        window.localStorage.setItem(APP_CLIENT_TYPE_KEY, APP_CLIENT_TYPE);
        window.localStorage.setItem(PREFERS_DARK_MODE, '${isDarkMode ? '1' : '0'}');
      })();`;
  }, [authToken, base64SharedSecret, identity, isDarkMode]);

  const webviewRef = useRef<WebView>(null);

  const handleLoad = useCallback((event: WebViewNavigationEvent) => {
    const { nativeEvent } = event;

    setIsLoading(nativeEvent.loading);
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: top,
        paddingBottom: bottom,
        backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[50],
      }}
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {identity && uri ? (
          <>
            <WebView
              key={uri} // Reloads the WebView when the uri changes
              ref={webviewRef}
              source={{ uri }}
              injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
              pullToRefreshEnabled={true}
              containerStyle={{
                paddingTop: 0,
              }}
              style={{ backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[50] }}
              originWhitelist={originWhitelist} // Keeps the WebView from navigating away from the feed-app; Any links that don't match will be opened by the system.. Eg: open in the browser
              onMessage={(event) => console.warn(event)}
              onLoad={handleLoad}
              forceDarkOn={isDarkMode}
            />
            {isLoading && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[50],
                }}
              >
                <ActivityIndicator
                  size="large"
                  color={isDarkMode ? Colors.slate[400] : Colors.slate[600]}
                />
              </View>
            )}
          </>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});
