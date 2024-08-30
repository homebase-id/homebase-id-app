import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDotYouClientContext } from 'feed-app-common';
import { useAuth } from '../auth/useAuth';
import { getPayloadBytes } from '../../provider/image/RNImageProvider';
import { TargetDrive } from '@homebase-id/js-lib/core';
import { getPayloadBytesOverPeerByGlobalTransitId } from '../../provider/image/RNPeerFileByGlobalTransitProvider';
import { getPayloadBytesOverPeer } from '../../provider/image/RNPeerFileProvider';
import { getDecryptedMediaDataOverPeerByGlobalTransitId, getDecryptedMediaUrlOverPeer } from '../../provider/image/RNExternalMediaProvider';

export type VideoData = {
  url: string;
  type: string;
};

export const useVideo = ({
  odinId,
  fileId,
  targetDrive,
  videoGlobalTransitId,
  payloadKey,
  enabled = false,
  probablyEncrypted,
  lastModified,
}: {
  odinId?: string;
  fileId?: string;
  targetDrive: TargetDrive;
  videoGlobalTransitId?: string | undefined;
  probablyEncrypted?: boolean;
  payloadKey?: string;
  enabled?: boolean;
  lastModified?: number;
}) => {
  const queryClient = useQueryClient();
  const dotyouClient = useDotYouClientContext();
  const token = useAuth().authToken;
  const localHost = dotyouClient.getIdentity(); // This is the identity of the user

  const fetchVideo = async ({ payloadKey }: { payloadKey?: string }) => {
    if (!fileId || !targetDrive || !payloadKey || !token) return;
    console.log(odinId, localHost);
    if (odinId && odinId !== localHost) {

      if (videoGlobalTransitId) {
        const payload = await getDecryptedMediaDataOverPeerByGlobalTransitId(dotyouClient, odinId, targetDrive, videoGlobalTransitId, payloadKey, token, probablyEncrypted, lastModified)
        if (!payload) return;

        if (typeof payload === 'string') {
          return {
            uri: payload as string,
            type: 'video/mp4',
          };
        }
        return payload;
      } else {
        const payload = await getDecryptedMediaUrlOverPeer(dotyouClient, odinId, targetDrive, fileId, payloadKey, token, probablyEncrypted, lastModified);
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
    const payload = await getPayloadBytes(dotyouClient, targetDrive, fileId, payloadKey, token);
    if (!payload) return;
    return {
      url: payload.uri,
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
    if (query?.state.status !== 'error') return query?.state.data;

    const video = await fetchVideo({ payloadKey });
    if (video) {
      queryClient.setQueryData(queryKey, video);
      return video;
    }
  };

  return {
    fetch: useQuery({
      queryKey: ['video', fileId, targetDrive.alias, payloadKey, videoGlobalTransitId, odinId],
      queryFn: () => fetchVideo({ payloadKey }),
      enabled: enabled,
    }),
    getFromCache: fetchFromCache,
  };
};
