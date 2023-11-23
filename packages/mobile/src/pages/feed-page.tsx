import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';

import { TabStackParamList } from '../app/App';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import WebView from 'react-native-webview';
import { uint8ArrayToBase64 } from '@youfoundation/js-lib/helpers';
import { Linking, TouchableOpacity, View } from 'react-native';
import useAuth, { feedHost } from '../hooks/auth/useAuth';
import { Text } from '../components/ui/Text/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../app/Colors';
import { useProfile } from '../hooks/profile/useProfile';
import {
  GetTargetDriveFromProfileId,
  BuiltInProfiles,
} from '@youfoundation/js-lib/profile';
import { OdinImage } from '../components/ui/OdinImage/OdinImage';
import { Bars } from '../components/ui/Icons/icons';

type FeedProps = NativeStackScreenProps<TabStackParamList, 'Feed'>;

const uri = `https://${feedHost}`;

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

  const insets = useSafeAreaInsets();
  const [hideHeader, setHideHeader] = useState<boolean>();
  const headerHeight = 40;

  const { data: profile } = useProfile();

  return (
    <SafeAreaView>
      {hideHeader ? null : (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: insets.top,
            backgroundColor: 'white',
            zIndex: 10,
            opacity: hideHeader ? 0 : 1,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            minHeight: headerHeight,
          }}>
          <View
            style={{
              padding: 10,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
            <OdinImage
              fit="contain"
              targetDrive={GetTargetDriveFromProfileId(
                BuiltInProfiles.StandardProfileId,
              )}
              fileId={profile?.profileImageFileId}
              fileKey={profile?.profileImageFileKey}
              imageSize={{ width: 30, height: 30 }}
              style={{ borderRadius: 30 / 2 }}
            />
            <View>
              <Text style={{ fontSize: 20 }}>Feed</Text>
              <Text style={{ fontSize: 12 }}>
                {profile?.firstName} {profile?.surName}
              </Text>
            </View>
            <TouchableOpacity
              style={{ marginLeft: 'auto' }}
              onPress={() => _props.navigation.navigate('Profile')}>
              <Bars size={'lg'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <WebView
        ref={ref => (webviewRef = ref)}
        source={{ uri: uri }}
        injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
        pullToRefreshEnabled={true}
        containerStyle={{
          paddingTop: hideHeader ? 0 : insets.top + headerHeight,
        }}
        style={{ backgroundColor: Colors.slate[50] }}
        originWhitelist={[uri]} // Keeps the WebView from navigating away from the feed-app; Any links that don't match will be opened by the system.. Eg: open in the browser
        onMessage={event => console.warn(event)}
        onScroll={event => {
          const scrollOffset = event.nativeEvent.contentOffset.y;
          if (scrollOffset > 20) setHideHeader(true);
          else setHideHeader(false);
        }}
      />
    </SafeAreaView>
  );
};

export default FeedPage;
