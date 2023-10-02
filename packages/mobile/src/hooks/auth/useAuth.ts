import { ApiType, DotYouClient } from '@youfoundation/js-lib/core';
import {
  base64ToUint8Array,
  byteArrayToString,
  stringToUint8Array,
  uint8ArrayToBase64,
} from '@youfoundation/js-lib/helpers';
import { useCallback, useEffect, useState } from 'react';
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
import { AppPermissionType } from '@youfoundation/js-lib/network';

export const drives = [
  {
    a: '4db49422ebad02e99ab96e9c477d1e08',
    t: 'a3227ffba87608beeb24fee9b70d92a6',
    n: 'Feed',
    d: '',
    p: DrivePermissionType.Read,
  },
  {
    // Standard profile Info
    a: '8f12d8c4933813d378488d91ed23b64c',
    t: '597241530e3ef24b28b9a75ec3a5c45c',
    n: '',
    d: '',
    p: DrivePermissionType.Read,
  },
  {
    // Homepage Config
    a: 'ec83345af6a747d4404ef8b0f8844caa',
    t: '597241530e3ef24b28b9a75ec3a5c45c',
    n: '',
    d: '',
    p: DrivePermissionType.Read,
  },
  {
    // Public posts
    a: 'e8475dc46cb4b6651c2d0dbd0f3aad5f',
    t: '8f448716e34cedf9014145e043ca6612',
    n: '',
    d: '',
    p: DrivePermissionType.Read + DrivePermissionType.Write,
  },
];
export const appName = 'Odin - Feed';
export const appId = '5f887d80-0132-4294-ba40-bda79155551d';

// Adapted to work in react-native; With no fallbacks to web support; If we someday merge this with the web version, we should add the fallbacks
const useAuth = () => {
  const {
    privateKey: privateKeyFromLocalStorage,
    setPrivateKey,
    sharedSecret,
    setSharedSecret,
    authToken,
    setAuthToken,
    identity,
    setIdentity,
  } = useEncrtypedStorage();

  const throwAwayTheKey = async () => await setPrivateKey('');

  const [authenticationState, setAuthenticationState] = useState<
    'unknown' | 'anonymous' | 'authenticated'
  >(sharedSecret ? 'unknown' : 'anonymous');

  const getRegistrationParams = async () => {
    const { privateKeyHex, publicKeyJwk } = await createEccPair();
    // Persist key for usage on finalize
    await setPrivateKey(JSON.stringify(privateKeyHex) + '');

    // Get params with publicKey embedded
    return await getRegistrationParamsYouAuth(
      'homebase-feed://auth/finalize/',
      appName,
      appId,
      [
        AppPermissionType.ReadConnections,
        AppPermissionType.ManageConnectionRequests,
        AppPermissionType.ReadCircleMembers,
        AppPermissionType.ReadWhoIFollow,
        AppPermissionType.ReadMyFollowers,
        AppPermissionType.SendDataToOtherIdentitiesOnMyBehalf,
        AppPermissionType.ReceiveDataFromOtherIdentitiesOnMyBehalf,
      ],
      undefined,
      drives,
      undefined,
      uint8ArrayToBase64(stringToUint8Array(JSON.stringify(publicKeyJwk))),
      // 'feed.homebase.id',
      'dev.dotyou.cloud:3002',
      `${
        Platform.OS === 'ios'
          ? 'iOS'
          : Platform.OS === 'android'
          ? 'Android'
          : Platform.OS
      } | ${Platform.Version}`,
    );
  };

  const finalizeAuthentication = async (
    identity: string,
    publicKey: string,
    salt: string,
  ) => {
    if (!identity || !publicKey || !salt) {
      console.error('Missing data');
      return false;
    }
    try {
      const privateKeyHex = JSON.parse(privateKeyFromLocalStorage || '');
      if (!privateKeyFromLocalStorage || !privateKeyHex) {
        console.error('Missing key');
        return false;
      }
      const publicKeyJwk = JSON.parse(
        byteArrayToString(base64ToUint8Array(publicKey)),
      );

      const { clientAuthToken, sharedSecret } =
        await finalizeAuthenticationYouAuth(
          identity,
          privateKeyHex,
          publicKeyJwk,
          salt,
        );

      await throwAwayTheKey();

      // Store all data in secure storage
      await setAuthToken(uint8ArrayToBase64(clientAuthToken));
      await setSharedSecret(uint8ArrayToBase64(sharedSecret));
      await setIdentity(identity);
    } catch (ex) {
      console.error(ex);
      return false;
    }

    return true;
  };

  const logout = useCallback(async (): Promise<void> => {
    await logoutYouauth(getDotYouClient());

    setAuthenticationState('anonymous');

    setPrivateKey('');
    setSharedSecret('');
    setAuthToken('');
    setIdentity('');
  }, []);

  const getDotYouClient = () => {
    if (!sharedSecret || !identity)
      return new DotYouClient({
        api: ApiType.App,
      });

    const headers: Record<string, string> = {};
    if (authToken) headers.bx0900 = authToken;

    return new DotYouClient({
      sharedSecret: base64ToUint8Array(sharedSecret),
      api: ApiType.App,
      identity: identity,
      headers: headers,
    });
  };

  const { data: hasValidToken, isFetchedAfterMount } = useVerifyToken(
    getDotYouClient(),
  );

  useEffect(() => {
    if (
      !!identity &&
      !!sharedSecret &&
      isFetchedAfterMount &&
      hasValidToken !== undefined
    ) {
      setAuthenticationState(hasValidToken ? 'authenticated' : 'anonymous');

      if (!hasValidToken) {
        setAuthenticationState('anonymous');
        if (sharedSecret) {
          console.log('Token is invalid, logging out..');
          logout();
        }
      }
    }
  }, [identity, sharedSecret, hasValidToken, isFetchedAfterMount, logout]);

  useEffect(() => {
    if (authenticationState === 'authenticated' && !sharedSecret)
      setAuthenticationState('anonymous');
  }, [sharedSecret, authenticationState]);

  return {
    getRegistrationParams,
    canFinzalizeAuthentication: !!privateKeyFromLocalStorage,
    finalizeAuthentication,
    logout,
    getDotYouClient,
    getSharedSecret: () =>
      sharedSecret ? base64ToUint8Array(sharedSecret) : undefined,
    authToken,
    getIdentity: () => identity,
    isAuthenticated: authenticationState !== 'anonymous',
  };
};

export default useAuth;
