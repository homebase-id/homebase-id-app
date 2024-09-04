import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { DotYouClient, HomebaseFile, TargetDrive, getFileHeader } from '@homebase-id/js-lib/core';
import { tryJsonParse } from '@homebase-id/js-lib/helpers';
import { PlainVideoMetadata, SegmentedVideoMetadata } from '@homebase-id/js-lib/media';
import {
  getFileHeaderBytesOverPeerByGlobalTransitId,
  getFileHeaderOverPeer,
} from '@homebase-id/js-lib/peer';

export const useVideoMetadata = (
  dotYouClient: DotYouClient,
  odinId?: string,
  videoFileId?: string | undefined,
  videoGlobalTransitId?: string | undefined,
  videoFileKey?: string | undefined,
  videoDrive?: TargetDrive
): {
  fetchMetadata: UseQueryResult<
    {
      fileHeader: HomebaseFile;
      metadata: PlainVideoMetadata | SegmentedVideoMetadata;
    } | null,
    Error
  >;
} => {
  const identity = dotYouClient.getIdentity();

  const fetchVideoData = async (
    odinId: string,
    videoFileId: string | undefined,
    videoGlobalTransitId: string | undefined,
    videoDrive?: TargetDrive
  ): Promise<{
    fileHeader: HomebaseFile;
    metadata: PlainVideoMetadata | SegmentedVideoMetadata;
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
      const payloadData = fileHeader.fileMetadata.payloads.find((p) => p.key === videoFileKey);
      const descriptor = payloadData?.descriptorContent;
      if (!descriptor) return undefined;

      const parsedMetaData = tryJsonParse<PlainVideoMetadata | SegmentedVideoMetadata>(descriptor);
      // The fileHeader contains the most accurate file size; So we use that one.
      parsedMetaData.fileSize = payloadData.bytesWritten;
      return { metadata: parsedMetaData, fileHeader };
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
      ],
      queryFn: () =>
        fetchVideoData(odinId || identity, videoFileId, videoGlobalTransitId, videoDrive),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      enabled: !!videoFileId && videoFileId !== '',
    }),
  };
};
