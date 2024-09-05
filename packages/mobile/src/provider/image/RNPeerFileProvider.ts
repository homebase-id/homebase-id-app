import {
  decryptKeyHeader,
  DotYouClient,
  SystemFileType,
  TargetDrive,
} from '@homebase-id/js-lib/core';
import {
  assertIfDefined,
  assertIfDefinedAndNotDefault,
  splitSharedSecretEncryptedKeyHeader,
  stringifyToQueryParams,
} from '@homebase-id/js-lib/helpers';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { encryptUrl } from './RNImageProvider';

import ReactNativeBlobUtil from 'react-native-blob-util';

interface GetFileRequest {
  odinId: string;
  alias: string;
  type: string;
  fileId: string;
}

interface GetPayloadRequest extends GetFileRequest {
  key: string;
}

interface GetThumbRequest extends GetFileRequest {
  payloadKey: string;
}

export const getThumbBytesOverPeer = async (
  dotYouClient: DotYouClient,
  odinId: string,
  targetDrive: TargetDrive,
  fileId: string,
  payloadKey: string,
  width: number,
  height: number,
  options: {
    systemFileType?: SystemFileType;
    lastModified?: number;
  }
): Promise<OdinBlob | null> => {
  assertIfDefined('OdinId', odinId);
  assertIfDefined('TargetDrive', targetDrive);
  assertIfDefined('FileId', fileId);
  assertIfDefined('PayloadKey', payloadKey);
  assertIfDefined('Width', width);
  assertIfDefined('Height', height);
  assertIfDefinedAndNotDefault('OdinId', odinId);

  const { systemFileType, lastModified } = options ?? { systemFileType: 'Standard' };

  const request: GetThumbRequest = {
    odinId: odinId,
    ...targetDrive,
    payloadKey: payloadKey,
    fileId,
  };

  const ss = dotYouClient.getSharedSecret();
  if (!ss) throw new Error('Shared secret not found');

  const url = await encryptUrl(
    `${dotYouClient.getEndpoint()}/transit/query/thumb?${stringifyToQueryParams({ ...request, width, height, lastModified })}`,
    ss
  );

  return ReactNativeBlobUtil.config({
    fileCache: true,
  })
    .fetch('GET', url, {
      ...dotYouClient.getHeaders(),
      'X-ODIN-FILE-SYSTEM-TYPE': systemFileType || 'Standard',
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

export const getPayloadBytesOverPeer = async (
  dotYouClient: DotYouClient,
  odinId: string,
  targetDrive: TargetDrive,
  fileId: string,
  key: string,
  options: {
    systemFileType?: SystemFileType;
    decrypt?: boolean;
    lastModified?: number;
  }
): Promise<OdinBlob | null> => {
  assertIfDefined('OdinId', odinId);
  assertIfDefined('TargetDrive', targetDrive);
  assertIfDefined('FileId', fileId);
  assertIfDefined('Key', key);
  assertIfDefinedAndNotDefault('OdinId', odinId);

  const { lastModified } = options;
  const decrypt = options?.decrypt ?? true;
  const systemFileType = options?.systemFileType ?? 'Standard';

  const request: GetPayloadRequest = {
    odinId: odinId,
    ...targetDrive,
    fileId,
    key,
  };

  const ss = dotYouClient.getSharedSecret();
  if (!ss) throw new Error('Shared secret not found');
  const url = await encryptUrl(
    `${dotYouClient.getEndpoint()}/transit/query/payload?${stringifyToQueryParams({ ...request, lastModified })}`,
    ss
  );

  return ReactNativeBlobUtil.config({
    fileCache: true,
  })
    .fetch('GET', url, {
      ...dotYouClient.getHeaders(),
      'X-ODIN-FILE-SYSTEM-TYPE': systemFileType || 'Standard',
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
        res.info().headers.sharedsecretencryptedheader64 &&
        decrypt
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
