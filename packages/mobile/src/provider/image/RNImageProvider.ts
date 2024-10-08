import {
  DotYouClient,
  TargetDrive,
  ImageContentType,
  ImageSize,
  SystemFileType,
  decryptKeyHeader,
} from '@homebase-id/js-lib/core';
import { MediaUploadMeta } from '@homebase-id/js-lib/media';
import {
  jsonStringify64,
  assertIfDefined,
  stringifyToQueryParams,
  stringToUint8Array,
  cbcEncrypt,
  uint8ArrayToBase64,
  splitSharedSecretEncryptedKeyHeader,
} from '@homebase-id/js-lib/helpers';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { AxiosRequestConfig } from 'axios';

import ReactNativeBlobUtil from 'react-native-blob-util';

export interface ImageSource {
  id?: string | null;
  filename?: string | null;
  filepath?: string | null;
  uri?: string;
  height: number;
  width: number;
  fileSize?: number | null;
  orientation?: number | null;
  type?: string | null;
  date?: number | null;
  playableDuration?: number | null;
  key?: string | null;
}

export interface RNMediaUploadMeta extends MediaUploadMeta {
  type: ImageContentType;
}

export const getThumbBytes = async (
  dotYouClient: DotYouClient,
  targetDrive: TargetDrive,
  fileId: string,
  payloadKey: string,
  width: number,
  height: number,
  options: {
    systemFileType?: SystemFileType;
    lastModified?: number;
    axiosConfig?: AxiosRequestConfig;
  }
): Promise<OdinBlob | null> => {
  assertIfDefined('DotYouClient', dotYouClient);
  assertIfDefined('TargetDrive', targetDrive);
  assertIfDefined('FileId', fileId);
  assertIfDefined('PayloadKey', payloadKey);
  assertIfDefined('Width', width);
  assertIfDefined('Height', height);

  const { lastModified } = options || {};

  const request = {
    ...targetDrive,
    fileId,
    payloadKey: payloadKey,
  };

  const ss = dotYouClient.getSharedSecret();
  if (!ss) throw new Error('Shared secret not found');
  const url = await encryptUrl(
    `${dotYouClient.getEndpoint()}/drive/files/thumb?${stringifyToQueryParams({
      ...request,
      width,
      height,
      lastModified,
    })}`,
    ss
  );

  //https://www.npmjs.com/package/rn-fetch-blob#download-example-fetch-files-that-need-authorization-token
  return ReactNativeBlobUtil.config({
    // add this option that makes response data to be stored as a file,
    // this is much more performant.
    fileCache: true,
  })
    .fetch('GET', url, {
      ...dotYouClient.getHeaders(),
      'X-ODIN-FILE-SYSTEM-TYPE': options?.systemFileType || 'Standard',
    })
    .then(async (res) => {
      if (res.info().status !== 200) throw new Error(`Failed to fetch thumb ${res.info().status}`);

      // Android filePaths need to start with file://
      const imageBlob = new OdinBlob(`file://${res.path()}`, {
        type: res.info().headers.decryptedcontenttype,
      });

      if (
        res.info().headers.payloadencrypted === 'True' &&
        res.info().headers.sharedsecretencryptedheader64
      ) {
        const encryptedKeyHeader = splitSharedSecretEncryptedKeyHeader(
          res.info().headers.sharedsecretencryptedheader64
        );
        const keyHeader = await decryptKeyHeader(dotYouClient, encryptedKeyHeader);
        const decryptedBlob = await imageBlob.decrypt(keyHeader.aesKey, keyHeader.iv);

        return decryptedBlob;
      } else if (res.info().headers.payloadencrypted === 'True') {
        throw new Error("Can't decrypt; missing keyheader");
      } else {
        return await imageBlob.fixExtension();
      }
    })
    .catch((err) => {
      console.error('Error fetching file', err);
      return null;
    });
};

export const getPayloadBytes = async (
  dotYouClient: DotYouClient,
  targetDrive: TargetDrive,
  fileId: string,
  key: string,
  options?: {
    systemFileType?: SystemFileType;
    lastModified?: number;
  }
): Promise<OdinBlob | null> => {
  assertIfDefined('DotYouClient', dotYouClient);
  assertIfDefined('TargetDrive', targetDrive);
  assertIfDefined('FileId', fileId);
  assertIfDefined('Key', key);

  const { lastModified } = options || {};

  const request = {
    ...targetDrive,
    fileId,
    key,
  };

  const ss = dotYouClient.getSharedSecret();
  if (!ss) throw new Error('Shared secret not found');
  const url = await encryptUrl(
    `${dotYouClient.getEndpoint()}/drive/files/payload?${stringifyToQueryParams({
      ...request,
      lastModified,
    })}`,
    ss
  );

  //https://www.npmjs.com/package/rn-fetch-blob#download-example-fetch-files-that-need-authorization-token
  return ReactNativeBlobUtil.config({
    // add this option that makes response data to be stored as a file,
    // this is much more performant.
    fileCache: true,
  })
    .fetch('GET', url, {
      ...dotYouClient.getHeaders(),
      'X-ODIN-FILE-SYSTEM-TYPE': options?.systemFileType || 'Standard',
    })
    .then(async (res) => {
      if (res.info().status !== 200) {
        throw new Error(`Failed to fetch payload ${res.info().status}`);
      }

      // Android filePaths need to start with file://
      const imageBlob = new OdinBlob(`file://${res.path()}`, {
        type: res.info().headers.decryptedcontenttype,
      });

      if (
        res.info().headers.payloadencrypted === 'True' &&
        res.info().headers.sharedsecretencryptedheader64
      ) {
        const encryptedKeyHeader = splitSharedSecretEncryptedKeyHeader(
          res.info().headers.sharedsecretencryptedheader64
        );
        const keyHeader = await decryptKeyHeader(dotYouClient, encryptedKeyHeader);
        const decryptedBlob = await imageBlob.decrypt(keyHeader.aesKey, keyHeader.iv);

        return decryptedBlob;
      } else if (res.info().headers.payloadencrypted === 'True') {
        throw new Error("Can't decrypt; missing keyheader");
      } else {
        return await imageBlob.fixExtension();
      }
    })
    .catch((err) => {
      console.error('Error fetching file', err);
      return null;
    });
};

export const getDecryptedImageData = async (
  dotYouClient: DotYouClient,
  targetDrive: TargetDrive,
  fileId: string,
  key: string,
  size?: ImageSize,
  systemFileType?: SystemFileType,
  lastModified?: number
): Promise<OdinBlob | null> => {
  if (size) {
    try {
      const thumbBytes = await getThumbBytes(
        dotYouClient,
        targetDrive,
        fileId,
        key,
        size.pixelWidth,
        size.pixelHeight,
        { systemFileType, lastModified }
      );
      if (thumbBytes) return thumbBytes;
    } catch {
      // Failed to get thumb data, try to get payload data
    }
  }

  return await getPayloadBytes(dotYouClient, targetDrive, fileId, key, {
    systemFileType,
    lastModified,
  });
};

// helpers
interface SharedSecretEncryptedPayload {
  iv: string;
  data: string;
}

const getRandomIv = () => crypto.getRandomValues(new Uint8Array(16));

export const encryptData = async (data: string, iv: Uint8Array, ss: Uint8Array) => {
  const bytes = stringToUint8Array(data);

  const encryptedBytes = await cbcEncrypt(bytes, iv, ss);
  const payload: SharedSecretEncryptedPayload = {
    iv: uint8ArrayToBase64(iv),
    data: uint8ArrayToBase64(encryptedBytes),
  };

  return payload;
};

const buildIvFromQueryString = async (querystring: string) => {
  const searchParams = new URLSearchParams(querystring);

  const uniqueQueryKey = (() => {
    // Check if it's a direct file request
    if (searchParams.has('fileId')) {
      return `${searchParams.get('fileId')} ${
        searchParams.get('key') || searchParams.get('payloadKey')
      }-${searchParams.get('height')}x${searchParams.get('width')}`;
    }
    // Check if it's a query-batch/modifed request; Queries on a single drive (alias)
    else if (searchParams.has('alias')) return querystring;
    // undefined => and we'll use a random IV
    else return undefined;
  })();

  const hashedQueryKey =
    uniqueQueryKey && typeof crypto.subtle.digest !== 'undefined'
      ? await crypto.subtle.digest('SHA-1', stringToUint8Array(uniqueQueryKey))
      : undefined;

  if (!hashedQueryKey) return undefined;

  const returnBytes = new Uint8Array(hashedQueryKey.slice(0, 16));

  if (returnBytes?.length !== 16) return undefined;

  return returnBytes;
};

export const encryptUrl = async (url: string, ss: Uint8Array) => {
  const parts = (url ?? '').split('?');
  const querystring = parts.length === 2 ? parts[1] : '';
  if (!querystring.length) return url;

  const dedicatedIv = await buildIvFromQueryString(querystring);

  const encryptedPayload: SharedSecretEncryptedPayload = await encryptData(
    querystring,
    dedicatedIv ?? getRandomIv(),
    ss
  );
  const encodedPayload = encodeURIComponent(jsonStringify64(encryptedPayload));

  return parts[0] + '?ss=' + encodedPayload;
};
