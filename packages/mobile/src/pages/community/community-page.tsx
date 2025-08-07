import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useMemo, useRef } from 'react';

import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import WebView from 'react-native-webview';
import { uint8ArrayToBase64 } from '@homebase-id/js-lib/helpers';
import { useAuth } from '../../hooks/auth/useAuth';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useRemoveNotifications } from '../../hooks/notifications/usePushNotifications';
import { COMMUNITY_APP_ID } from '../../app/constants';
import { CommunityStackParamList } from '../../app/CommunityStack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CommunityProps = NativeStackScreenProps<CommunityStackParamList, 'Home'>;

export const CommunityPage = memo((_props: CommunityProps) => {
  const { isDarkMode } = useDarkMode();
  const { authToken, getIdentity, getSharedSecret } = useAuth();
  const identity = getIdentity();

  const { typeId, tagId } = _props.route.params;

  useRemoveNotifications({ appId: COMMUNITY_APP_ID });
  const { top, bottom } = useSafeAreaInsets();

  const sharedSecret = getSharedSecret();
  const base64SharedSecret = sharedSecret ? uint8ArrayToBase64(sharedSecret) : '';

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

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: top,
        paddingBottom: bottom,
        backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[50],
      }}
    >
      {identity && uri ? (
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
          forceDarkOn={isDarkMode}
        />
      ) : null}
    </SafeAreaView>
  );
});
