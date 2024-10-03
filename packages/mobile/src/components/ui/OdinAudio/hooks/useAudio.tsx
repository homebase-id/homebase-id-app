import { TargetDrive } from '@homebase-id/js-lib/core';
import { useDotYouClientContext } from 'homebase-id-app-common';
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
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const fetchAudio = async (
    fileId?: string,
    payloadKey?: string,
    drive?: TargetDrive,
    lastModified?: number
  ): Promise<AudioData | null> => {
    if (fileId === undefined || fileId === '' || !drive || !payloadKey) {
      return null;
    }
    const cachedAudio = getFromCache(fileId, payloadKey, drive);
    if (cachedAudio) return cachedAudio;

    const audioBlob = await getPayloadBytes(dotYouClient, drive, fileId, payloadKey, {
      lastModified,
    });
    if (!audioBlob) return null;
    return {
      url: audioBlob.uri,
      type: audioBlob.type,
    };
  };

  const getFromCache = (
    fileId: string,
    payloadKey: string,
    drive: TargetDrive
  ): AudioData | null => {
    const queryKey = ['audio', drive?.alias, fileId, payloadKey];
    const cachedEntries = queryClient.getQueryCache().find<AudioData | null>({
      queryKey,
      exact: true,
    });

    if (cachedEntries?.state.status === 'success') {
      return cachedEntries.state.data || null;
    }
    return null;
  };

  return {
    fetch: useQuery({
      queryKey: ['audio', drive?.alias, fileId, payloadKey, lastModified],
      queryFn: () => fetchAudio(fileId, payloadKey, drive, lastModified),
      staleTime: 1000 * 60 * 60 * 1, // 1h
      enabled: !!fileId && fileId !== '',
    }),
    fetchManually: async (fileId: string, payloadKey: string, drive: TargetDrive) => {
      const cachedAudio = getFromCache(fileId, payloadKey, drive);
      if (cachedAudio) return cachedAudio;
      const audio = await fetchAudio(fileId, payloadKey, drive, lastModified);
      if (audio) {
        queryClient.setQueryData(['audio', drive?.alias, fileId, payloadKey, lastModified], audio);
      }
    },
  };
};
