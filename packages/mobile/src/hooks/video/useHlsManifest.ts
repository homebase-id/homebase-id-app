import { useQuery } from '@tanstack/react-query';
import {
  DotYouClient,
  HomebaseFile,
  SystemFileType,
  TargetDrive,
  decryptKeyHeader,
  InterceptionEncryptionUtil,
} from '@homebase-id/js-lib/core';
import { getNewId, stringifyToQueryParams, uint8ArrayToBase64 } from '@homebase-id/js-lib/helpers';
import { getAnonymousDirectImageUrl } from '@homebase-id/js-lib/media';
import { useVideoMetadata } from './useVideoMetadata';
import { useDotYouClientContext } from 'homebase-id-app-common';
import { CachesDirectoryPath, writeFile } from 'react-native-fs';
import { useLocalWebServer } from './useLocalWebServer';
import { Platform } from 'react-native';

export const useHlsManifest = (
  odinId?: string,
  videoFileId?: string | undefined,
  videoGlobalTransitId?: string | undefined,
  videoFileKey?: string | undefined,
  videoDrive?: TargetDrive
) => {
  useLocalWebServer(Platform.OS === 'ios');

  const dotYouClient = useDotYouClientContext();
  const identity = dotYouClient.getIdentity();
  const { data: videoFileData, isFetched: videoFileDataFetched } = useVideoMetadata(
    odinId,
    videoFileId,
    videoGlobalTransitId,
    videoFileKey,
    videoDrive
  ).fetchMetadata;

  const fetchManifest = async (
    odinId: string,
    videoFile: HomebaseFile | undefined,
    videoDrive: TargetDrive | undefined,
    videoFileKey: string | undefined
  ): Promise<string | null> => {
    if (
      !videoFile ||
      videoFileId === undefined ||
      videoFileId === '' ||
      !videoDrive ||
      videoFileKey === undefined ||
      videoFileKey === ''
    ) {
      return null;
    }

    if (!videoFileData || !('hlsPlaylist' in videoFileData.metadata) || !videoFileData?.metadata) {
      return null;
    }

    const contents = await replaceSegmentUrls(
      videoFileData?.metadata.hlsPlaylist,
      async (url) => {
        return (
          (await getSegmentUrl(
            dotYouClient,
            odinId,
            videoDrive,
            videoFile.fileId,
            videoFileKey,
            videoFileData?.fileHeader.fileMetadata.isEncrypted || false
          )) || url
        );
      },
      async (url) => {
        if (!videoFileData?.fileHeader.sharedSecretEncryptedKeyHeader) return url;
        const keyHeader = await decryptKeyHeader(
          dotYouClient,
          videoFileData?.fileHeader.sharedSecretEncryptedKeyHeader
        );

        return (await getKeyUrl(keyHeader.aesKey)) || url;
      }
    );

    const fileName = `${getNewId()}-manifest.m3u8`;
    const filePath = `file://${CachesDirectoryPath}/${fileName}`;
    await writeFile(filePath, contents, 'utf8');

    // iOS needs to fetch the manifest over http; Android can use the local file on disk
    if (Platform.OS === 'ios') {
      return `http://localhost:3000/manifest?file=${fileName}`;
    }
    return filePath;
  };

  return {
    fetch: useQuery({
      queryKey: [
        'video-hls-manifest',
        odinId || identity,
        videoDrive?.alias,
        videoGlobalTransitId || videoFileId,
      ],
      queryFn: () =>
        fetchManifest(odinId || identity, videoFileData?.fileHeader, videoDrive, videoFileKey),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      enabled: !!videoFileId && videoFileId !== '' && videoFileDataFetched,
    }),
  };
};

const replaceSegmentUrls = async (
  playlistContent: string,
  replaceFunction: (url: string, index: number) => Promise<string>,
  replaceKeyFunction: (url: string) => Promise<string>
): Promise<string> => {
  // Split the playlist content into lines
  const lines = playlistContent.split('\n');
  const modifiedLines: string[] = [];
  let segmentIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if the line is an encryption key URL
    if (line.startsWith('#EXT-X-KEY:METHOD=AES-128')) {
      // Extract the URI part (key URL)
      const uriRegex = /URI="([^"]+)"/;
      const match = line.match(uriRegex);

      if (match && match[1]) {
        const originalKeyUrl = match[1];
        // Replace the key URL using the provided function
        const newKeyUrl = await replaceKeyFunction(originalKeyUrl);
        // Replace the original URL in the line with the new URL
        modifiedLines.push(line.replace(originalKeyUrl, newKeyUrl));
      }
    }
    // Check if the line is a URL (not a comment or metadata)
    else if (!line.startsWith('#') && line.trim() !== '') {
      // Use the replaceFunction to replace the URL
      const newUrl = await replaceFunction(line.trim(), segmentIndex);
      segmentIndex++;
      modifiedLines.push(newUrl);
    } else {
      // Return the line unchanged if it's a comment or metadata
      modifiedLines.push(line);
    }
  }

  // Join the modified lines back into a single string
  const modifiedPlaylistContent = modifiedLines.join('\n');
  return modifiedPlaylistContent;
};

const getSegmentUrl = async (
  dotYouClient: DotYouClient,
  odinId: string,
  videoDrive: TargetDrive,
  videoFileId: string,
  videoFileKey: string,
  isEncrypted: boolean,
  systemFileType?: SystemFileType
) => {
  const identity = dotYouClient.getIdentity();
  if (!isEncrypted) {
    return await getAnonymousDirectImageUrl(
      odinId || identity,
      videoDrive,
      videoFileId,
      videoFileKey,
      undefined,
      systemFileType
    );
  }

  const ss = dotYouClient.getSharedSecret();
  if (!ss) {
    return null;
  }

  const params = {
    ...videoDrive,
    fileId: videoFileId,
    key: videoFileKey,

    xfst: systemFileType || 'Standard',
  };

  const unenryptedPayloadUrl =
    odinId !== identity
      ? `${dotYouClient.getEndpoint()}/transit/query/payload?${stringifyToQueryParams({ odinId, ...params })}`
      : `${dotYouClient.getEndpoint()}/drive/files/payload?${stringifyToQueryParams(params)}`;

  return InterceptionEncryptionUtil.encryptUrl(unenryptedPayloadUrl, ss);
};

const getKeyUrl = async (aesKey: Uint8Array) =>
  `data:application/octet-stream;base64,${uint8ArrayToBase64(aesKey)}`;
