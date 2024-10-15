import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { getPayloadBytes } from '../../provider/image/RNImageProvider';
import { TargetDrive } from '@homebase-id/js-lib/core';
import {
  getDecryptedMediaDataOverPeerByGlobalTransitId,
  getDecryptedMediaUrlOverPeer,
} from '../../provider/image/RNExternalMediaProvider';
import { addLogs } from '../../provider/log/logger';
import { generateClientError } from '../errors/useErrors';

export type VideoData = {
  uri: string;
  type: string;
};

export const useVideo = ({
  odinId,
  fileId,
  targetDrive,
  videoGlobalTransitId,
  payloadKey,
  probablyEncrypted,
  lastModified,
}: {
  odinId?: string;
  fileId?: string;
  targetDrive: TargetDrive;
  videoGlobalTransitId?: string | undefined;
  probablyEncrypted?: boolean;
  payloadKey?: string;
  lastModified?: number;
}) => {
  const queryClient = useQueryClient();
  const dotyouClient = useDotYouClientContext();
  const localHost = dotyouClient.getIdentity(); // This is the identity of the user

  const fetchVideo = async ({ payloadKey }: { payloadKey?: string }) => {
    if (!fileId || !targetDrive || !payloadKey) return null;
    if (odinId && odinId !== localHost) {
      if (videoGlobalTransitId) {
        const payload = await getDecryptedMediaDataOverPeerByGlobalTransitId(
          dotyouClient,
          odinId,
          targetDrive,
          videoGlobalTransitId,
          payloadKey,
          probablyEncrypted,
          lastModified
        );
        if (!payload) return;

        if (typeof payload === 'string') {
          return {
            uri: payload as string,
            type: 'video/mp4',
          };
        }
        return payload;
      } else {
        const payload = await getDecryptedMediaUrlOverPeer(
          dotyouClient,
          odinId,
          targetDrive,
          fileId,
          payloadKey,
          probablyEncrypted,
          lastModified
        );
        if (!payload) return;
        if (typeof payload === 'string') {
          return {
            uri: payload as string,
            type: 'video/mp4',
          };
        }
        return payload;
      }
    }
    const payload = await getPayloadBytes(dotyouClient, targetDrive, fileId, payloadKey);
    if (!payload) return;
    return {
      uri: payload.uri,
      type: payload.type,
    };
  };

  const fetchFromCache = async (payloadKey: string) => {
    if (!fileId) return;
    const queryKey = ['video', fileId, targetDrive.alias, payloadKey, videoGlobalTransitId, odinId];
    const query = queryClient.getQueryCache().find<VideoData>({
      queryKey,
      exact: false,
    });

    if (query?.state.status === 'success') return query?.state.data;
  };

  return {
    fetch: useQuery({
      queryKey: ['video', fileId, targetDrive.alias, payloadKey, videoGlobalTransitId, odinId],
      queryFn: () => fetchVideo({ payloadKey }),
      throwOnError: (error, _) => {
        const newError = generateClientError(error, t('Failed to get the video file'));
        addLogs(newError);
        return false;
      },
    }),
    fetchManually: async (payloadKey: string) => {
      const queryKey = [
        'video',
        fileId,
        targetDrive.alias,
        payloadKey,
        videoGlobalTransitId,
        odinId,
      ];
      const cachedVideo = await fetchFromCache(payloadKey);
      if (cachedVideo) return cachedVideo;
      const video = await fetchVideo({ payloadKey });
      if (video) {
        queryClient.setQueryData(queryKey, video);
        return video;
      }
    },
  };
};
