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
import { AppPermissionType, ContactConfig } from '@youfoundation/js-lib/network';
import { BlogConfig, HomePageConfig } from '@youfoundation/js-lib/public';
import { BuiltInProfiles, GetTargetDriveFromProfileId } from '@youfoundation/js-lib/profile';
import { useQueryClient } from '@tanstack/react-query';

const StandardProfileDrive = GetTargetDriveFromProfileId(BuiltInProfiles.StandardProfileId);
export const drives = [
  {
    a: BlogConfig.FeedDrive.alias,
    t: BlogConfig.FeedDrive.type,
    n: 'Feed',
    d: '',
    p: DrivePermissionType.Read,
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
  {
    // Contacts drive
    a: ContactConfig.ContactTargetDrive.alias,
    t: ContactConfig.ContactTargetDrive.type,
    n: '',
    d: '',
    p: DrivePermissionType.Read + DrivePermissionType.Write,
  },
];
export const appName = 'Homebase - Feed';
export const appId = '5f887d80-0132-4294-ba40-bda79155551d';
export const feedHost = 'feed.homebase.id';

// Adapted to work in react-native; With no fallbacks to web support; If we someday merge this with the web version, we should add the fallbacks
const useAuth = () => {
  const {
    setPrivateKey,
    sharedSecret,
    setSharedSecret,
    authToken,
    setAuthToken,
    identity,
    setIdentity,
  } = useEncrtypedStorage();

  const [authenticationState, setAuthenticationState] = useState<
    'unknown' | 'anonymous' | 'authenticated'
  >(sharedSecret ? 'unknown' : 'anonymous');

  const queryClient = useQueryClient();

  const getDotYouClient = useCallback(() => {
    if (!sharedSecret || !identity) {
      return new DotYouClient({
        api: ApiType.App,
      });
    }

    const headers: Record<string, string> = {};
    if (authToken) headers.bx0900 = authToken;

    return new DotYouClient({
      sharedSecret: base64ToUint8Array(sharedSecret),
      api: ApiType.App,
      identity: identity,
      headers: headers,
    });
  }, [authToken, identity, sharedSecret]);

  const { data: hasValidToken, isFetchedAfterMount } = useVerifyToken(getDotYouClient());

  const logout = useCallback(async (): Promise<void> => {
    await logoutYouauth(getDotYouClient());

    setAuthenticationState('anonymous');

    setPrivateKey('');
    setSharedSecret('');
    setAuthToken('');
    setIdentity('');

    queryClient.refetchQueries();
  }, [getDotYouClient, queryClient, setAuthToken, setIdentity, setPrivateKey, setSharedSecret]);

  useEffect(() => {
    if (!!identity && !!sharedSecret && isFetchedAfterMount && hasValidToken !== undefined) {
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
    if (authenticationState === 'authenticated' && !sharedSecret) {
      setAuthenticationState('anonymous');
    }
  }, [sharedSecret, authenticationState]);

  return {
    logout,
    getDotYouClient,
    getSharedSecret: () => (sharedSecret ? base64ToUint8Array(sharedSecret) : undefined),
    authToken,
    getIdentity: () => identity,
    isAuthenticated: authenticationState !== 'anonymous',
  };
};

export const useYouAuthAuthorization = () => {
  const {
    privateKey: privateKeyFromLocalStorage,
    setPrivateKey,
    setSharedSecret,
    setAuthToken,
    setIdentity,
  } = useEncrtypedStorage();

  // const throwAwayTheKey = async () => await setPrivateKey('');

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
      feedHost,
      `${Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS} | ${
        Platform.Version
      }`
    );
  };

  const finalizeAuthentication = async (identity: string, publicKey: string, salt: string) => {
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
      const publicKeyJwk = JSON.parse(byteArrayToString(base64ToUint8Array(publicKey)));

      const { clientAuthToken, sharedSecret } = await finalizeAuthenticationYouAuth(
        identity,
        privateKeyHex,
        publicKeyJwk,
        salt
      );

      // await throwAwayTheKey();

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

  return { getRegistrationParams, finalizeAuthentication };
};

export default useAuth;
