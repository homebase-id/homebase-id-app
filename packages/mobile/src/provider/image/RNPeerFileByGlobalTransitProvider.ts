import {
  assertIfDefined,
  assertIfDefinedAndNotDefault,
  splitSharedSecretEncryptedKeyHeader,
  stringifyToQueryParams,
} from '@homebase-id/js-lib/helpers';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import {
  decryptKeyHeader,
  DotYouClient,
  SystemFileType,
  TargetDrive,
} from '@homebase-id/js-lib/core';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { encryptUrl } from './RNImageProvider';

interface GetFileRequest {
  odinId: string;
  alias: string;
  type: string;
  globalTransitId: string;
}

interface GetPayloadRequest extends GetFileRequest {
  key: string;
}

interface GetThumbRequest extends GetFileRequest {
  payloadKey: string;
}

export const getPayloadBytesOverPeerByGlobalTransitId = async (
  dotYouClient: DotYouClient,
  odinId: string,
  targetDrive: TargetDrive,
  globalTransitId: string,
  key: string,
  options: {
    systemFileType?: SystemFileType;
    decrypt?: boolean;
    lastModified?: number;
  }
): Promise<OdinBlob | null> => {
  assertIfDefined('DotYouClient', dotYouClient);
  assertIfDefined('TargetDrive', targetDrive);
  assertIfDefined('GlobalTransitId', globalTransitId);
  assertIfDefined('Key', key);
  assertIfDefinedAndNotDefault('OdinId', odinId);

  const decrypt = options?.decrypt ?? true;
  const { systemFileType, lastModified } = options ?? { systemFileType: 'Standard' };
  const request: GetPayloadRequest = {
    odinId: odinId,
    ...targetDrive,
    globalTransitId,
    key: key,
  };

  const ss = dotYouClient.getSharedSecret();
  if (!ss) throw new Error('Shared secret not found');

  const url = await encryptUrl(
    `${dotYouClient.getEndpoint()}/transit/query/payload_byglobaltransitid?${stringifyToQueryParams({ ...request, lastModified })}`,
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

export const getThumbBytesOverPeerByGlobalTransitId = async (
  dotYouClient: DotYouClient,
  odinId: string,
  targetDrive: TargetDrive,
  globalTransitId: string,
  payloadKey: string,
  width: number,
  height: number,
  options: {
    systemFileType?: SystemFileType;
    lastModified?: number;
  }
): Promise<OdinBlob | null> => {
  assertIfDefined('DotYouClient', dotYouClient);
  assertIfDefined('TargetDrive', targetDrive);
  assertIfDefined('GlobalTransitId', globalTransitId);
  assertIfDefined('PayloadKey', payloadKey);
  assertIfDefined('Width', width);
  assertIfDefined('Height', height);
  assertIfDefinedAndNotDefault('OdinId', odinId);

  const { systemFileType, lastModified } = options ?? { systemFileType: 'Standard' };
  const request: GetThumbRequest = {
    odinId: odinId,
    ...targetDrive,
    globalTransitId,
    payloadKey: payloadKey,
  };

  const ss = dotYouClient.getSharedSecret();
  if (!ss) throw new Error('Shared secret not found');

  const url = await encryptUrl(
    `${dotYouClient.getEndpoint()}/transit/query/payload_byglobaltransitid?${stringifyToQueryParams({ ...request, width, height, lastModified })}`,
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
