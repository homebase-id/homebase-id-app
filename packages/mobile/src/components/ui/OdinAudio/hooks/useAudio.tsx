import { TargetDrive } from '@youfoundation/js-lib/core';
import { useAuth } from '../../../../hooks/auth/useAuth';
import { useDotYouClientContext } from 'feed-app-common';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPayloadBytes } from '../../../../provider/image/RNImageProvider';

export interface OdinAudioProps {
  fileId?: string;
  payloadKey?: string;
  drive?: TargetDrive;
  lastModified?: number;
}

interface AudioData {
  url: string;
  type?: string;
}

export const useAudio = (props?: OdinAudioProps) => {
  const { fileId, payloadKey, drive, lastModified } = props || {};
  const { authToken } = useAuth();
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const fetchAudio = async (
    fileId?: string,
    payloadKey?: string,
    drive?: TargetDrive,
    lastModified?: number
  ): Promise<AudioData | null> => {
    if (fileId === undefined || fileId === '' || !drive || !payloadKey || !authToken) {
      return null;
    }

    const audioBlob = await getPayloadBytes(dotYouClient, drive, fileId, payloadKey, authToken, {
      lastModified,
    });

    if (!audioBlob) return null;
    return {
      url: audioBlob.uri,
      type: audioBlob.type,
    };
  };
  return {
    fetch: useQuery({
      queryKey: ['audio', drive?.alias, fileId, payloadKey, lastModified],
      queryFn: () => fetchAudio(fileId, payloadKey, drive, lastModified),
      staleTime: 1000 * 60 * 60 * 1, // 1h
      enabled: !!fileId && fileId !== '',
    }),
    getFromCache: (fileId: string, payloadKey: string, drive: TargetDrive) => {
      const cachedEntries = queryClient.getQueryCache().find<AudioData | null>({
        queryKey: ['audio', drive?.alias, fileId, payloadKey],
        exact: true,
      });

      return cachedEntries?.state.data;
    },
  };
};
