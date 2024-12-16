import { useQuery } from '@tanstack/react-query';
import { useDotYouClientContext } from 'homebase-id-app-common';
import { Image } from 'react-native';
import { getPayloadAsJson, TargetDrive } from '@homebase-id/js-lib/core';
import { getLinkPreview, LinkPreview } from '@homebase-id/js-lib/media';
import {
  getPayloadAsJsonOverPeer,
  getPayloadAsJsonOverPeerByGlobalTransitId,
} from '@homebase-id/js-lib/peer';

export const useLinkPreview = (url: string | undefined) => {
  const dotyouclient = useDotYouClientContext();
  async function fetchLinkData(): Promise<LinkPreview | null> {
    if (!url) {
      return null;
    }
    const linkMeta: LinkPreview | null = await getLinkPreview(dotyouclient, url);
    if (linkMeta && linkMeta?.imageUrl && (!linkMeta?.imageHeight || !linkMeta?.imageWidth)) {
      await Image.getSize(linkMeta.imageUrl, (width, height) => {
        linkMeta.imageHeight = height;
        linkMeta.imageWidth = width;
      });
    }
    return linkMeta;
  }

  return {
    get: useQuery({
      queryKey: ['ogp', url],
      enabled: !!url,
      queryFn: fetchLinkData,
      staleTime: 2000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }),
  };
};

export const useLinkMetadata = ({
  targetDrive,
  fileId,
  payloadKey,
  odinId,
  globalTransitId,
}: {
  targetDrive: TargetDrive;
  fileId: string;
  globalTransitId?: string;
  odinId?: string;
  payloadKey: string;
}) => {
  const dotYouClient = useDotYouClientContext();
  const identity = dotYouClient.getLoggedInIdentity();
  const fetchLinkData = async () => {
    if (!fileId || !payloadKey || !targetDrive) {
      return null;
    }
    if (odinId && odinId !== identity) {
      if (globalTransitId) {
        return getPayloadAsJsonOverPeerByGlobalTransitId<LinkPreview[]>(
          dotYouClient,
          odinId,
          targetDrive,
          globalTransitId,
          payloadKey
        );
      }
      return getPayloadAsJsonOverPeer<LinkPreview[]>(
        dotYouClient,
        odinId,
        targetDrive,
        fileId,
        payloadKey
      );
    }
    return getPayloadAsJson<LinkPreview[]>(dotYouClient, targetDrive, fileId, payloadKey);
  };

  return useQuery({
    queryKey: ['link-metadata', targetDrive.alias, fileId, payloadKey],
    queryFn: fetchLinkData,
  });
};
