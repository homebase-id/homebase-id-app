import { MMKVLoader, useMMKVStorage } from 'react-native-mmkv-storage';

const APP_AUTH_TOKEN = 'bx0900';
const APP_SHARED_SECRET = 'APSS';
const PRIVATE_KEY = 'ecc-pk';
const IDENTITY = 'identity';
const EARLIEST_SYNC_TIME = 'earliestSyncTime';
const LAST_SYNC_TIME = 'lastSyncTime';
const LAST_BACKUP_CURSOR = 'lastBackupCursor';
const LAST_QUERY_BATCH_CURSOR = 'queryBatchCursor';
const MOST_RECENT_QUERY_MODIFIED_TIME = 'queryModifiedTime';
const SYNC_FROM_CAMERA_ROLL = 'syncFromCameraRoll';
const BACKUP_FROM_CAMERA_ROLL = 'backupFromCameraRoll';

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

export const useKeyValueStorage = () => {
  const [earliestSyncTime, setEarliestSyncTime] = useMMKVStorage(EARLIEST_SYNC_TIME, storage, '');

  const [lastCameraRollSyncTime, setLastCameraRollSyncTime] = useMMKVStorage(
    LAST_SYNC_TIME,
    storage,
    ''
  );

  const [cameraRollBackupCursor, setCameraRollBackupCursor] = useMMKVStorage(
    LAST_BACKUP_CURSOR,
    storage,
    ''
  );

  const [lastQueryBatchCursor, setLastQueryBatchCursor] = useMMKVStorage(
    LAST_QUERY_BATCH_CURSOR,
    storage,
    ''
  );
  const [mostRecentQueryModifiedTime, setMostRecentQueryModifiedTime] = useMMKVStorage(
    MOST_RECENT_QUERY_MODIFIED_TIME,
    storage,
    ''
  );

  const [syncFromCameraRoll, setSyncFromCameraRoll] = useMMKVStorage(
    SYNC_FROM_CAMERA_ROLL,
    storage,
    '1'
  );

  const [backupFromCameraRoll, setBackupFromCameraRoll] = useMMKVStorage(
    BACKUP_FROM_CAMERA_ROLL,
    storage,
    '0'
  );

  return {
    earliestSyncTime: earliestSyncTime.length ? earliestSyncTime : null,
    setEarliestSyncTime,
    lastCameraRollSyncTime: lastCameraRollSyncTime.length ? lastCameraRollSyncTime : null,
    setLastCameraRollSyncTime,
    cameraRollBackupCursor: cameraRollBackupCursor.length ? cameraRollBackupCursor : null,
    setCameraRollBackupCursor,
    lastQueryBatchCursor: lastQueryBatchCursor.length ? lastQueryBatchCursor : null,
    setLastQueryBatchCursor,
    mostRecentQueryModifiedTime: mostRecentQueryModifiedTime.length
      ? mostRecentQueryModifiedTime
      : null,
    setMostRecentQueryModifiedTime,

    syncFromCameraRoll: syncFromCameraRoll === '1',
    setSyncFromCameraRoll: (value: boolean) => {
      setLastCameraRollSyncTime('');
      setEarliestSyncTime('');
      if (!value) setBackupFromCameraRoll('0');
      setSyncFromCameraRoll(value ? '1' : '0');
    },

    backupFromCameraRoll: backupFromCameraRoll === '1',
    setBackupFromCameraRoll: (value: boolean) => {
      setCameraRollBackupCursor('');
      setBackupFromCameraRoll(value ? '1' : '0');
    },
  };
};
