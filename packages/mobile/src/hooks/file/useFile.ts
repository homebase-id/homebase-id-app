import { TargetDrive } from '@homebase-id/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
import { getPayloadFile } from '../../provider/files/RNFileProvider';
import { CachesDirectoryPath, exists } from 'react-native-fs';
import { OdinBlob } from '../../../polyfills/OdinBlob';

export const useFile = ({ targetDrive }: { targetDrive: TargetDrive }) => {
  const dotYouClient = useDotYouClientContext();

  const downloadFile = async (odinId: string | undefined, fileId: string, payloadKey?: string) => {
    if (!fileId || !payloadKey) return null;
    const payload = await getPayloadFile(dotYouClient, targetDrive, fileId, payloadKey);
    if (!payload) return null;
    return payload;
  };

  const fetchLocalFile = async (fileId: string, contentType: string) => {
    const localPath = CachesDirectoryPath + `/${fileId}` + `.${contentType.split('/')[1]}`;
    const uri = `file://${localPath}`;
    if (await exists(localPath)) {
      return new OdinBlob(uri, { type: contentType });
    }
    return null;
  };

  return {
    downloadFile: downloadFile,
    fetchFile: fetchLocalFile,
  };
};
