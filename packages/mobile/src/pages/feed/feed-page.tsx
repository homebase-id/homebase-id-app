import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useMemo, useRef, useState } from 'react';

import { TabStackParamList } from '../../app/App';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import WebView from 'react-native-webview';
import { uint8ArrayToBase64 } from '@youfoundation/js-lib/helpers';
import { RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/auth/useAuth';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ScrollView } from 'react-native-gesture-handler';
import { useRemoveNotifications } from '../../hooks/notifications/usePushNotifications';
import { FEED_APP_ID } from '../../app/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GetTargetDriveFromProfileId, BuiltInProfiles } from '@youfoundation/js-lib/profile';
import { Bars, Ellipsis, Lol, Plus } from '../../components/ui/Icons/icons';
import { OdinImage } from '../../components/ui/OdinImage/OdinImage';
import { useProfile } from '../../hooks/profile/useProfile';

type FeedProps = NativeStackScreenProps<TabStackParamList, 'Feed'>;

export const FeedPage = memo((_props: FeedProps) => {
  const { isDarkMode } = useDarkMode();
  const { authToken, getIdentity, getSharedSecret } = useAuth();
  const identity = getIdentity();

  const [hideHeader, setHideHeader] = useState<boolean>();

  useRemoveNotifications({ appId: FEED_APP_ID });

  const sharedSecret = getSharedSecret();
  const base64SharedSecret = sharedSecret ? uint8ArrayToBase64(sharedSecret) : '';

  const uri = useMemo(() => `https://${identity}/apps/feed`, [identity]);
  const originWhitelist = useMemo(() => [`https://${identity}`], [identity]);

  // const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta);
  // @2002Bishwajeet: this ☝️ ain't right.. It breaks the injected_javascript fully (I assume as the JS is set to load before the content);
  //  To be honest Not sure if we want it, and if we do, it should be part of the feed-app itself, enabling it based on the "client_type" key in the localStorage

  const INJECTED_JAVASCRIPT = useMemo(() => {
    return `(function() {
        const APP_SHARED_SECRET_KEY = 'APPS_feed';
        const APP_AUTH_TOKEN_KEY = 'BX0900_feed';
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

  const [refreshing, setRefreshing] = useState(false);
  const [refresherEnabled, setEnableRefresher] = useState(true);
  const webviewRef = useRef<WebView>(null);

  //Code to get scroll position
  const handleScroll = (event: any) => {
    const yOffset = Number(event.nativeEvent.contentOffset.y);
    if (yOffset === 0) {
      setEnableRefresher(true);
    } else if (refresherEnabled) {
      setEnableRefresher(false);
    }

    if (yOffset > 20) setHideHeader(true);
    else setHideHeader(false);
  };

  return (
    <SafeAreaView>
      {hideHeader ? null : <PostComposer />}
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
            containerStyle={{
              paddingTop: 0,
            }}
            style={{ backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[50] }}
            originWhitelist={originWhitelist} // Keeps the WebView from navigating away from the feed-app; Any links that don't match will be opened by the system.. Eg: open in the browser
            onMessage={(event) => console.warn(event)}
            onScroll={handleScroll}
            onLoadEnd={() => setRefreshing(false)}
            forceDarkOn={isDarkMode}
          />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
});

const PostComposer = () => {
  const { isDarkMode } = useDarkMode();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: insets.top,
        paddingHorizontal: 8,
        backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        zIndex: 10,
      }}
    >
      <View
        style={{
          padding: 16,
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
          borderWidth: 1,
          borderColor: Colors.gray[100],
          borderRadius: 6,
        }}
      >
        <TextInput
          placeholder="What's up?"
          style={{ paddingVertical: 5, lineHeight: 20, fontSize: 16 }}
        />
        <View
          style={{
            marginTop: 12,
            display: 'flex',
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <TouchableOpacity>
            <Plus size={'sm'} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Lol size={'sm'} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ellipsis size={'sm'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
