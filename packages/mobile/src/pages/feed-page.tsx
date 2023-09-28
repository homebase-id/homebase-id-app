import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';

import { TabStackParamList } from '../app/App';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import WebView from 'react-native-webview';
import { uint8ArrayToBase64 } from '@youfoundation/js-lib/helpers';
import { Linking } from 'react-native';
import useAuth from '../hooks/auth/useAuth';

type FeedProps = NativeStackScreenProps<TabStackParamList, 'Feed'>;

const uri = 'https://dev.dotyou.cloud:3002/';

const FeedPage = (_props: FeedProps) => {
  let webviewRef: WebView | null = null;
  const { authToken, getIdentity, getSharedSecret } = useAuth();

  const sharedSecret = getSharedSecret();
  const base64SharedSecret = sharedSecret
    ? uint8ArrayToBase64(sharedSecret)
    : '';

  const INJECTED_JAVASCRIPT = `(function() {
        const APP_SHARED_SECRET_KEY = 'APSS';
        const APP_AUTH_TOKEN_KEY = 'BX0900';
        const IDENTITY_KEY = 'identity';

        const APP_SHARED_SECRET = '${base64SharedSecret}';
        const APP_AUTH_TOKEN = '${authToken}';
        const IDENTITY = '${getIdentity()}';

        window.localStorage.setItem(APP_SHARED_SECRET_KEY, APP_SHARED_SECRET);
        window.localStorage.setItem(APP_AUTH_TOKEN_KEY, APP_AUTH_TOKEN);
        window.localStorage.setItem(IDENTITY_KEY, IDENTITY);
      })();`;

  // // Debug for webview
  // console = new Object();
  // console.log = function(log) {
  //   // window.webViewBridge.send("console", log);
  // };
  // console.debug = console.log;
  // console.info = console.log;
  // console.warn = console.log;
  // console.error = console.log;

  return (
    <SafeAreaView>
      <WebView
        ref={ref => {
          webviewRef = ref;
        }}
        source={{ uri: uri }}
        injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
        style={{ flex: 1 }}
        pullToRefreshEnabled={true}
        onNavigationStateChange={navState => {
          if (!navState.url.startsWith(uri)) {
            if (webviewRef) webviewRef.stopLoading();
            Linking.openURL(navState.url);
            return;
          }
        }}
        onMessage={event => console.warn(event)}
      />
    </SafeAreaView>
  );
};

export default FeedPage;
