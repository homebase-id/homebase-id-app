import { MMKVLoader, useMMKVStorage } from 'react-native-mmkv-storage';

const APP_AUTH_TOKEN = 'bx0900';
const APP_SHARED_SECRET = 'APSS';
const PRIVATE_KEY = 'ecc-pk';
const IDENTITY = 'identity';

const storage = new MMKVLoader().initialize();

export const useEncrtypedStorage = () => {
  const [privateKey, setPrivateKey] = useMMKVStorage(PRIVATE_KEY, storage, '');
  const [authToken, setAuthToken] = useMMKVStorage(
    APP_AUTH_TOKEN,
    storage,
    '' //'3oYQrbm/PUGypaFr01PFuVhcfKSU56klPGr+X+u5oT4D',
  );
  const [sharedSecret, setSharedSecret] = useMMKVStorage(
    APP_SHARED_SECRET,
    storage,
    '' //'OMuqKgQgcbB8uQHzuGORmA==',
  );
  const [identity, setIdentity] = useMMKVStorage(
    IDENTITY,
    storage,
    '' //'samwisegamgee.me',
  );

  return {
    privateKey: privateKey.length ? privateKey : null,
    setPrivateKey,
    authToken: authToken.length ? authToken : null,
    setAuthToken,
    sharedSecret: sharedSecret.length ? sharedSecret : null,
    setSharedSecret,
    identity: identity.length ? identity : null,
    setIdentity,
  };
};
