import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';

import { TabStackParamList } from '../app/App';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import WebView from 'react-native-webview';
import { useAuth } from 'homebase-feed-app';
import { uint8ArrayToBase64 } from '@youfoundation/js-lib/helpers';

type FeedProps = NativeStackScreenProps<TabStackParamList, 'Feed'>;

const FeedPage = (_props: FeedProps) => {
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

  return (
    <SafeAreaView>
      <WebView
        source={{ uri: 'https://dev.dotyou.cloud:3002/' }}
        injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
};

export default FeedPage;
