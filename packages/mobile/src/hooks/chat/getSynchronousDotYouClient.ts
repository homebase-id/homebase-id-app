import { DotYouClient, ApiType } from '@homebase-id/js-lib/core';
import { base64ToUint8Array } from '@homebase-id/js-lib/helpers';
import { MMKVLoader } from 'react-native-mmkv-storage';

const APP_AUTH_TOKEN = 'bx0900';
const APP_SHARED_SECRET = 'APSS';
const IDENTITY = 'identity';

export const getSynchronousDotYouClient = async () => {
  const storage = new MMKVLoader().initialize();

  const getFromStorage = (key: string) =>
    new Promise<string | undefined>((resolve) =>
      storage.getString(key, (_err, result) => resolve(result || undefined))
    );

  const sharedSecret = await getFromStorage(APP_SHARED_SECRET);
  const identity = await getFromStorage(IDENTITY);
  const authToken = await getFromStorage(APP_AUTH_TOKEN);

  const dotYouClient = (() => {
    if (!sharedSecret || !identity) {
      return new DotYouClient({
        api: ApiType.App,
        hostIdentity: '',
      });
    }

    const headers: Record<string, string> = {};
    if (authToken) headers.bx0900 = authToken;

    return new DotYouClient({
      sharedSecret: base64ToUint8Array(sharedSecret),
      api: ApiType.App,
      loggedInIdentity: identity,
      hostIdentity: identity,
      headers: headers,
    });
  })();

  return dotYouClient;
};
