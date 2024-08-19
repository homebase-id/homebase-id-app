import { ApiType, DotYouClient } from '@youfoundation/js-lib/core';
import {
  base64ToUint8Array,
  byteArrayToString,
  stringToUint8Array,
  uint8ArrayToBase64,
} from '@youfoundation/js-lib/helpers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useVerifyToken from './useVerifyToken';
import {
  createEccPair,
  getRegistrationParams as getRegistrationParamsYouAuth,
  finalizeAuthentication as finalizeAuthenticationYouAuth,
} from '../../provider/auth/AuthenticationProvider';
import { logout as logoutYouauth } from '@youfoundation/js-lib/auth';
import { useEncrtypedStorage } from './useEncryptedStorage';
import { Platform } from 'react-native';
import { DrivePermissionType } from '@youfoundation/js-lib/core';
import {
  ALL_CONNECTIONS_CIRCLE_ID,
  AppPermissionType,
  ContactConfig,
} from '@youfoundation/js-lib/network';
import { BlogConfig, HomePageConfig } from '@youfoundation/js-lib/public';
import { BuiltInProfiles, GetTargetDriveFromProfileId } from '@youfoundation/js-lib/profile';
import { useQueryClient } from '@tanstack/react-query';

const StandardProfileDrive = GetTargetDriveFromProfileId(BuiltInProfiles.StandardProfileId);

export const ChatConfig = {
  ChatDrive: {
    alias: '9ff813aff2d61e2f9b9db189e72d1a11',
    type: '66ea8355ae4155c39b5a719166b510e3',
  },
  name: 'Chat Drive',
  description: 'Drive which contains all the chat messages',
};

export const drives = [
  {
    a: BlogConfig.FeedDrive.alias,
    t: BlogConfig.FeedDrive.type,
    n: '',
    d: '',
    p: DrivePermissionType.Read + DrivePermissionType.Write,
  },
  {
    a: ChatConfig.ChatDrive.alias,
    t: ChatConfig.ChatDrive.type,
    n: ChatConfig.name,
    d: 'Drive which contains all the chat messages',
    p: DrivePermissionType.Read + DrivePermissionType.Write + DrivePermissionType.React,
  },
  {
    // Standard profile Info
    a: StandardProfileDrive.alias,
    t: StandardProfileDrive.type,
    n: '',
    d: '',
    p: DrivePermissionType.Read,
  },
  {
    // Homepage Config
    a: HomePageConfig.HomepageTargetDrive.alias,
    t: HomePageConfig.HomepageTargetDrive.type,
    n: '',
    d: '',
    p: DrivePermissionType.Read,
  },
  {
    // Contacts drive
    a: ContactConfig.ContactTargetDrive.alias,
    t: ContactConfig.ContactTargetDrive.type,
    n: '',
    d: '',
    p: DrivePermissionType.Read + DrivePermissionType.Write,
  },
  {
    // Public posts
    a: BlogConfig.PublicChannelDrive.alias,
    t: BlogConfig.PublicChannelDrive.type,
    n: '',
    d: '',
    p:
      DrivePermissionType.Read +
      DrivePermissionType.Write +
      DrivePermissionType.React +
      DrivePermissionType.Comment,
  },
];
export const permissionKeys = [
  AppPermissionType.ReadConnections,
  AppPermissionType.ReadConnectionRequests,
  AppPermissionType.ReadCircleMembers,
  AppPermissionType.ReadWhoIFollow,
  AppPermissionType.ReadMyFollowers,
  AppPermissionType.ManageFeed,
  AppPermissionType.SendDataToOtherIdentitiesOnMyBehalf,
  AppPermissionType.ReceiveDataFromOtherIdentitiesOnMyBehalf,
  AppPermissionType.PublishStaticContent,
  AppPermissionType.SendPushNotifications,
];

const circleDrives = [
  {
    a: ChatConfig.ChatDrive.alias,
    t: ChatConfig.ChatDrive.type,
    n: ChatConfig.name,
    d: '',
    p: DrivePermissionType.Write + DrivePermissionType.React,
  },
];
export const appName = 'Homebase - Feed & Chat';
export const appId = 'b4a2a939-45d3-42af-95bf-7d241016e3bf';
export const corsHost = undefined;

// Split up, just checks if the token is valid, and logs out if not
export const useValidTokenCheck = () => {
  const { getDotYouClient, logout } = useAuth();
  const dotYouClient = getDotYouClient();
  const { data: hasValidToken, isFetchedAfterMount } = useVerifyToken(dotYouClient);

  useEffect(() => {
    if (isFetchedAfterMount && hasValidToken === false) {
      console.log('Token is invalid, logging out..');
      logout();
    }
  }, [hasValidToken, isFetchedAfterMount, logout]);
};

export const useAuth = () => {
  const {
    setPrivateKey,
    sharedSecret,
    setSharedSecret,
    authToken,
    setAuthToken,
    identity,
    setIdentity,
    setLastLoggedOutIdentity,
    lastLoggedOutIdentity,
  } = useEncrtypedStorage();

  const [authenticationState, setAuthenticationState] = useState<'anonymous' | 'authenticated'>(
    sharedSecret && identity ? 'authenticated' : 'anonymous'
  );

  // In react-native, if there's a sharedSecret and identity, we assume logged in state;
  //   It's the responsibility of the `usevalidTokenCheck` to logout if it's not valid
  useEffect(
    () => setAuthenticationState(sharedSecret && identity ? 'authenticated' : 'anonymous'),
    [sharedSecret, identity]
  );

  const getDotYouClient = useCallback(() => {
    if (!sharedSecret || !identity || !authToken) {
      return new DotYouClient({
        api: ApiType.App,
      });
    }

    const headers: Record<string, string> = {};
    headers.bx0900 = authToken;

    return new DotYouClient({
      sharedSecret: base64ToUint8Array(sharedSecret),
      api: ApiType.App,
      identity: identity,
      headers: headers,
    });
  }, [authToken, identity, sharedSecret]);

  const queryClient = useQueryClient();
  const logout = useCallback(async (): Promise<void> => {
    await logoutYouauth(getDotYouClient());

    // Store last logged out identity
    if (identity) {
      setLastLoggedOutIdentity(identity);
    }

    setAuthenticationState('anonymous');

    setPrivateKey('');
    setSharedSecret('');
    setAuthToken('');
    setIdentity('');

    queryClient.removeQueries();
  }, [
    getDotYouClient,
    identity,
    queryClient,
    setAuthToken,
    setIdentity,
    setLastLoggedOutIdentity,
    setPrivateKey,
    setSharedSecret,
  ]);

  return {
    logout,
    getDotYouClient,
    authToken,
    getSharedSecret: useCallback(
      () => sharedSecret && base64ToUint8Array(sharedSecret),
      [sharedSecret]
    ),
    getLastIdentity: useCallback(() => lastLoggedOutIdentity, [lastLoggedOutIdentity]),
    getIdentity: useCallback(() => identity, [identity]),
    isAuthenticated: useMemo(() => authenticationState !== 'anonymous', [authenticationState]),
  };
};

export const useYouAuthAuthorization = () => {
  const { privateKey, setPrivateKey, setSharedSecret, setAuthToken, setIdentity } =
    useEncrtypedStorage();

  const getRegistrationParams = useCallback(async () => {
    const { privateKeyHex, publicKeyJwk } = await createEccPair();
    // Persist key for usage on finalize
    setPrivateKey(JSON.stringify(privateKeyHex) + '');

    // Get params with publicKey embedded
    return await getRegistrationParamsYouAuth(
      'homebase-fchat://auth/finalize/',
      appName,
      appId,
      permissionKeys,
      undefined,
      drives,
      circleDrives,
      [ALL_CONNECTIONS_CIRCLE_ID],
      uint8ArrayToBase64(stringToUint8Array(JSON.stringify(publicKeyJwk))),
      corsHost,
      `${Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS} | ${
        Platform.Version
      }`
    );
  }, [setPrivateKey]);

  const finalizeAuthentication = useCallback(
    async (identity: string, publicKey: string, salt: string) => {
      if (!identity || !publicKey || !salt || !privateKey) {
        console.error('Missing data');
        return false;
      }
      try {
        const privateKeyHex = JSON.parse(privateKey || '');
        if (!privateKey || !privateKeyHex) {
          console.error('Missing key');
          return false;
        }
        const publicKeyJwk = JSON.parse(byteArrayToString(base64ToUint8Array(publicKey)));

        const { clientAuthToken, sharedSecret } = await finalizeAuthenticationYouAuth(
          identity,
          privateKeyHex,
          publicKeyJwk,
          salt
        );

        // Store all data in storage
        setAuthToken(uint8ArrayToBase64(clientAuthToken));
        setSharedSecret(uint8ArrayToBase64(sharedSecret));
        setIdentity(identity);
      } catch (ex) {
        console.error(ex);
        return false;
      }

      return true;
    },
    [privateKey, setAuthToken, setIdentity, setSharedSecret]
  );

  return { getRegistrationParams, finalizeAuthentication };
};
