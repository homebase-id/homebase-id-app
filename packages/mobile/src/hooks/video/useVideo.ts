import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDotYouClientContext } from 'feed-app-common';
import { useAuth } from '../auth/useAuth';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { getPayloadBytes } from '../../provider/image/RNImageProvider';
import { TargetDrive } from '@homebase-id/js-lib/core';

export type VideoData = {
  url: string;
  type: string;
};

export const useVideo = ({
  fileId,
  targetDrive,
  payloadKey,
  enabled = false,
}: {
  fileId?: string;
  targetDrive: TargetDrive;
  payloadKey?: string;
  enabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const dotyouClient = useDotYouClientContext();
  const token = useAuth().authToken;

  const fetchVideo = async ({ payloadKey }: { payloadKey?: string }) => {
    if (!fileId || !targetDrive || !payloadKey || !token) return;
    const payload = await getPayloadBytes(dotyouClient, ChatDrive, fileId, payloadKey, token);
    if (!payload) return;
    return {
      url: payload.uri,
      type: payload.type,
    };
  };

  const fetchFromCache = async (payloadKey: string) => {
    if (!fileId) return;
    const queryKey = ['video', fileId, targetDrive.alias, payloadKey];
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
      queryKey: ['video', fileId, targetDrive.alias, payloadKey],
      queryFn: () => fetchVideo({ payloadKey }),
      enabled: enabled,
    }),
    getFromCache: fetchFromCache,
  };
};
