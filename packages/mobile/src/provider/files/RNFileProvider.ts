import { decryptKeyHeader, DotYouClient, SystemFileType, TargetDrive } from '@youfoundation/js-lib/core';
import { assertIfDefined, splitSharedSecretEncryptedKeyHeader, stringifyToQueryParams } from '@youfoundation/js-lib/helpers';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import ReactNativeBlobUtil, { ReactNativeBlobUtilConfig } from 'react-native-blob-util';
import { encryptUrl } from '../image/RNImageProvider';

export const getPayloadFile = async (
    dotYouClient: DotYouClient,
    targetDrive: TargetDrive,
    fileId: string,
    key: string,
    authToken: string,
    progress?: ReactNativeBlobUtilConfig['Progress'],
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

    // const client = getAxiosClient(dotYouClient, systemFileType);
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
        Progress: progress,
    })
        .fetch('GET', url, {
            bx0900: authToken,
            'X-ODIN-FILE-SYSTEM-TYPE': options?.systemFileType || 'Standard',
        })
        .then(async (res) => {
            if (res.info().status !== 200) {
                throw new Error(`Failed to fetch payload ${res.info().status}`);
            }

            // Android filePaths need to start with file://
            const imageBlob = new OdinBlob(`file://${res.path()}`, {
                type: res.info().headers.decryptedcontenttype,
                id: fileId, // needed so we could check the file by this id locally
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
