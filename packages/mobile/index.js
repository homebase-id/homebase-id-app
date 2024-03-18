/**
 * @format
 */

// Base64 polyfill
import { decode, encode } from 'base-64';

if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;

// URL Search Params polyfill
import 'react-native-url-polyfill/auto';

// TextEncoder Polyfill
import { TextEncoder, TextDecoder } from 'text-encoding-polyfill';

if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

// Crypto polyfill
//  => Fallback to webcrypto which depends on node.js crypto module which we then polyfill with react-native-quick-crypto
// => https://github.com/PeculiarVentures/webcrypto and https://github.com/margelo/react-native-quick-crypto
import { Crypto as webcrypto } from './polyfills/webcrypto';
import { getRandomValues } from 'react-native-quick-crypto';
if (!global.crypto?.subtle) {
  global.crypto = {
    subtle: new webcrypto().subtle,
    getRandomValues: getRandomValues,
  };
}

// Blob Polyfill
import { OdinBlob } from './polyfills/OdinBlob';
global.CustomBlob = OdinBlob;

// FormData within react-native is always used by the network polyfills.. No way to polyfill without overriding the network polyfills or the direct pacakge;
// FormData Polyfill => Done with patch-package

// LocalStorage proper undefined marking
global.localStorage = undefined;
// eslint-disable-next-line no-undef
localStorage = undefined;

import { AppRegistry } from 'react-native';
import App from './src/app/App';
// import App from './src/compress-fragment/App';
import { name as appName } from './app.json';

//
// Notification support
//

// Save last notification to AsyncStorage (will overwrite previous)
// SEB:TODO This should be done in a more robust way, like a queue of notifications
import AsyncStorage from '@react-native-async-storage/async-storage';
const saveNotification = async (notification) => {
  await AsyncStorage.setItem('lastNotification', JSON.stringify(notification));
};

// Register notification background handler
//
// https://rnfirebase.io/messaging/usage#background--quit-state-messages
//
// SEB:TODO headless https://rnfirebase.io/messaging/usage#background-application-state
//
// iOS: OK
// Android: OK
import messaging from '@react-native-firebase/messaging';
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message saved in the background', remoteMessage);
  await saveNotification(remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
