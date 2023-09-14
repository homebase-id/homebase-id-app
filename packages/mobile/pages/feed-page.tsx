import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';

import { TabStackParamList } from '../app/App';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import WebView from 'react-native-webview';

type FeedProps = NativeStackScreenProps<TabStackParamList, 'Feed'>;

const FeedPage = (_props: FeedProps) => {
  const INJECTED_JAVASCRIPT = `(function() {
        const APP_SHARED_SECRET_KEY = 'APSS';
        const APP_AUTH_TOKEN_KEY = 'BX0900';
        const IDENTITY_KEY = 'identity';

        const APP_SHARED_SECRET = '/GA216nJiRjhg1RqLzA8Cg==';
        const APP_AUTH_TOKEN = 'd0U42Tjp3kGBPOocNYXUb2reDKaSFN82QJLilgXX/SED';
        const IDENTITY = 'frodobaggins.me';

        window.localStorage.setItem(APP_SHARED_SECRET_KEY, APP_SHARED_SECRET);
        window.localStorage.setItem(APP_AUTH_TOKEN_KEY, APP_AUTH_TOKEN);
        window.localStorage.setItem(IDENTITY_KEY, IDENTITY);
      })();`;

  return (
    <SafeAreaView>
      <WebView
        source={{ uri: 'https://photos.odin.earth/' }}
        // injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
};

export default FeedPage;
