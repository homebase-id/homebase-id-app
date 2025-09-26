import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { DEFAULT_PAYLOAD_DESCRIPTOR_KEY, HomebaseFile, TargetDrive, getFileHeader, getPayloadAsJson } from '@homebase-id/js-lib/core';
import { tryJsonParse } from '@homebase-id/js-lib/helpers';
import {
  HlsVideoMetadata,
  PlainVideoMetadata,
  SegmentedVideoMetadata,
} from '@homebase-id/js-lib/media';
import {
  getFileHeaderBytesOverPeerByGlobalTransitId,
  getFileHeaderOverPeer,
  getPayloadAsJsonOverPeer,
  getPayloadAsJsonOverPeerByGlobalTransitId,
} from '@homebase-id/js-lib/peer';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { addLogs } from '../../provider/log/logger';
import { generateClientError } from '../errors/useErrors';

export const useVideoMetadata = (
  odinId?: string,
  videoFileId?: string | undefined,
  videoGlobalTransitId?: string | undefined,
  videoFileKey?: string | undefined,
  videoDrive?: TargetDrive
): {
  fetchMetadata: UseQueryResult<
    {
      fileHeader: HomebaseFile;
      metadata: PlainVideoMetadata | SegmentedVideoMetadata | HlsVideoMetadata;
    } | null,
    Error
  >;
} => {
  const dotYouClient = useDotYouClientContext();
  const identity = dotYouClient.getLoggedInIdentity();

  const fetchVideoData = async (
    odinId: string,
    videoFileId: string | undefined,
    videoGlobalTransitId: string | undefined,
    videoDrive?: TargetDrive
  ): Promise<{
    fileHeader: HomebaseFile;
    metadata: PlainVideoMetadata | SegmentedVideoMetadata | HlsVideoMetadata;
  } | null> => {
    if (
      videoFileId === undefined ||
      videoFileId === '' ||
      videoFileKey === undefined ||
      videoFileKey === '' ||
      !videoDrive
    ) {
      return null;
    }

    const fetchMetaPromise = async () => {
      const fileHeader =
        odinId !== identity
          ? videoGlobalTransitId
            ? await getFileHeaderBytesOverPeerByGlobalTransitId(
              dotYouClient,
              odinId,
              videoDrive,
              videoGlobalTransitId
            )
            : await getFileHeaderOverPeer(dotYouClient, odinId, videoDrive, videoFileId)
          : await getFileHeader(dotYouClient, videoDrive, videoFileId);

      if (!fileHeader) return undefined;
      const payloadData = fileHeader.fileMetadata.payloads?.find((p) => p.key === videoFileKey);
      const descriptor = payloadData?.descriptorContent;
      if (!descriptor) return undefined;

      const parsedMetaData = tryJsonParse<
        PlainVideoMetadata | SegmentedVideoMetadata | HlsVideoMetadata
      >(descriptor);
      if (parsedMetaData?.isDescriptorContentComplete === false) {
        const descriptorKey = parsedMetaData.key || DEFAULT_PAYLOAD_DESCRIPTOR_KEY;
        const fullMetaData = odinId !== identity
          ? videoGlobalTransitId
            ? await getPayloadAsJsonOverPeerByGlobalTransitId<PlainVideoMetadata | SegmentedVideoMetadata | HlsVideoMetadata>(
              dotYouClient, odinId, videoDrive, videoGlobalTransitId, descriptorKey,
            ) : await getPayloadAsJsonOverPeer<PlainVideoMetadata | SegmentedVideoMetadata | HlsVideoMetadata>(
              dotYouClient, odinId, videoDrive, videoFileId, descriptorKey,
            ) : await getPayloadAsJson<PlainVideoMetadata | SegmentedVideoMetadata | HlsVideoMetadata>(
              dotYouClient, videoDrive, videoFileId, descriptorKey,
            );
        if (!fullMetaData) return undefined;
        // The fileHeader contains the most accurate file size; So we use that one.
        fullMetaData.fileSize = payloadData.bytesWritten;
        return { metadata: fullMetaData, fileHeader };
      }
      else {
        // The fileHeader contains the most accurate file size; So we use that one.
        parsedMetaData.fileSize = payloadData.bytesWritten;
        return { metadata: parsedMetaData as PlainVideoMetadata | SegmentedVideoMetadata | HlsVideoMetadata, fileHeader };
      }
    };

    return (await fetchMetaPromise()) || null;
  };

  return {
    fetchMetadata: useQuery({
      queryKey: [
        'video-metadata',
        odinId || identity,
        videoDrive?.alias,
        videoGlobalTransitId || videoFileId,
        videoFileKey,
      ],
      queryFn: () =>
        fetchVideoData(odinId || identity || '', videoFileId, videoGlobalTransitId, videoDrive),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      enabled: !!videoFileId && videoFileId !== '',
      throwOnError: (error, _) => {
        const newError = generateClientError(error, t('Failed to get the video metadata'));
        addLogs(newError);
        return false;
      },
    }),
  };
};
