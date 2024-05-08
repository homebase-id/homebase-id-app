import { TargetDrive } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
import { getPayloadBytes } from '../../provider/image/RNImageProvider';
import { useAuth } from '../auth/useAuth';

export const useFile = ({ targetDrive }: { targetDrive: TargetDrive }) => {
    const dotYouClient = useDotYouClientContext();
    const authToken = useAuth().authToken;

    const fetchFile = async (odinId: string | undefined, fileId: string, payloadKey?: string) => {
        if (!fileId || !payloadKey || !authToken) return null;
        const payload = await getPayloadBytes(dotYouClient, targetDrive, fileId, payloadKey, authToken);
        if (!payload) return null;
        return payload;
    };

    return {
        fetchFile: fetchFile,
    };
};
