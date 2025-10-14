import { getNewId, toGuidId, uint8ArrayToBase64 } from '@homebase-id/js-lib/helpers';

import { CachesDirectoryPath, exists, readFile, stat, unlink, writeFile } from 'react-native-fs';
import { Video } from 'react-native-compressor';
import { Platform } from 'react-native';

import { FFmpegKit, FFprobeKit, SessionState } from 'ffmpeg-kit-react-native';
import {
  HlsVideoMetadata,
  PlainVideoMetadata,
  SegmentedVideoMetadata,
} from '@homebase-id/js-lib/media';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { KeyHeader } from '@homebase-id/js-lib/core';
import { ImageSource } from '../image/RNImageProvider';

const CompressVideo = async (
  video: ImageSource,
  onUpdate?: (progress: number) => void
): Promise<ImageSource> => {
  try {
    const source = video.filepath || video.uri;

    if (!source || !(await exists(source))) {
      throw new Error(`File not found: ${source}`);
    }

    let runningProgress = 0;
    const resultUri = await Video.compress(
      source,
      {
        compressionMethod: 'manual',
        maxSize: 1280,
        bitrate: 3000000,
      },
      (progress) => {
        const newProgress = Math.round(progress * 100) / 100;
        if (newProgress > runningProgress) {
          runningProgress = newProgress;
          onUpdate?.(runningProgress);
        }
      }
    );

    return {
      ...video,
      uri: resultUri,
      filepath: resultUri,
    };
  } catch (ex) {
    console.error('failed to compress video', ex);
    return video;
  }
};

const toHexString = (byteArray: Uint8Array) => {
  return Array.from(byteArray, function (byte) {
    // eslint-disable-next-line no-bitwise
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
};

const MB = 1000000;
interface HLSVideo {
  playlist: ImageSource;
  segments: ImageSource;
}

// Function to get video codec information
const getVideoCodec = async (inputFilePath: string) => {
  return new Promise((resolve, reject) => {
    // Command to get codec information
    const command = `-v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1 ${inputFilePath}`;

    // throw new Error('FFmpegKit is not available currently.');
    FFprobeKit.execute(command)
      .then(async (session) => {
        const state = await session.getState();
        const returnCode = await session.getReturnCode();
        const output = await session.getOutput();

        if (state === SessionState.FAILED || !returnCode.isValueSuccess()) {
          reject(new Error(`FFmpeg process failed with state: ${state} and rc: ${returnCode}`));
        } else {
          // Process output to extract codec name
          const codec = output.trim().split('=')[1];
          resolve(codec);
        }
      })
      .catch((error) => {
        reject(new Error(`FFmpeg process failed with error: ${error}`));
      });
  });
};

const segmentVideo = async (
  video: ImageSource,
  keyHeader?: KeyHeader
): Promise<ImageSource | HLSVideo | null> => {
  try {
    const source = video.filepath || video.uri;

    if (!source || !(await exists(source))) {
      throw new Error(`File not found: ${source}`);
    }

    const sourceFileSize = await stat(source).then((stats) => stats.size);
    if (sourceFileSize < 5 * MB) {
      return {
        ...video,
      };
    }

    const dirPath = CachesDirectoryPath;
    const destinationPrefix = Platform.OS === 'ios' ? '' : 'file://';

    const { keyInfoUri, pathsToClean } =
      (await (async () => {
        if (keyHeader) {
          const keyUrl = 'http://example.com/path/to/encryption.key';
          const keyUri = `${destinationPrefix}${dirPath}/hls-encryption.key`;
          // const ivUri = `${destinationPrefix}${dirPath}/hls-iv.bin`;
          const keyInfoUri = `${destinationPrefix}${dirPath}/hls-key_inf.txt`;

          await writeFile(keyUri, uint8ArrayToBase64(keyHeader.aesKey), 'base64');

          const keyInfo = `${keyUrl}\n${keyUri}\n${toHexString(keyHeader.iv)}`;

          await writeFile(keyInfoUri, keyInfo, 'utf8');

          return { keyInfoUri, pathsToClean: [keyUri, keyInfoUri] };
        }
      })()) || {};

    const playlistUri = `${destinationPrefix}${dirPath}/ffmpeg-segmented-${getNewId()}.m3u8`;
    const encryptionInfo = keyHeader
      ? `-hls_key_info_file ${keyInfoUri}` // -hls_enc 1`
      : '';

    let command;
    const codec = await getVideoCodec(source);
    if (codec === 'h264') {
      command = `-i ${source} -codec: copy ${encryptionInfo} -hls_time 6 -hls_list_size 0 -f hls -hls_flags single_file ${playlistUri}`;
    } else {
      command = `-i ${source} -c:v libx264 -preset fast -crf 23 -c:a aac ${encryptionInfo} -hls_time 6 -hls_list_size 0 -f hls -hls_flags single_file ${playlistUri}`;
    }


    try {
      const session = await FFmpegKit.execute(command);
      const state = await session.getState();
      const returnCode = await session.getReturnCode();

      if (state === SessionState.FAILED || !returnCode.isValueSuccess()) {
        throw new Error(`FFmpeg process failed with state: ${state} and rc: ${returnCode}.`);
      }

      const segmentsUri = playlistUri.replace('.m3u8', '.ts');

      try {
        pathsToClean?.forEach(async (path) => {
          unlink(path);
        });

        unlink(source);
      } catch (error) {
        console.warn(`Failed to clean up video files: ${error}`);
      }

      return {
        playlist: {
          ...video,
          fileSize: (await stat(playlistUri).then((stats) => stats.size)) || video.fileSize,
          type: 'application/vnd.apple.mpegurl',
          uri: playlistUri,
          filepath: playlistUri,
          playableDuration: video.playableDuration,
        },
        segments: {
          ...video,
          type: 'video/mp2t',
          uri: segmentsUri,
          filepath: segmentsUri,
          playableDuration: video.playableDuration,
        },
      };
    } catch (error) {
      throw new Error(`FFmpeg process failed with error: ${error}`);
    }
  } catch (ex) {
    console.error('failed to fragment video', ex);
    return null;
  }
};

export const getUniqueId = (video: ImageSource) => {
  return video.id
    ? toGuidId(video.id as string)
    : toGuidId(`${video.filename}_${video.width}x${video.height}`);
};

export const grabThumbnail = async (video: ImageSource) => {
  const source = video.filepath || video.uri;

  if (!source || !(await exists(source))) {
    console.error(`File not found: ${source}`);
    return null;
  }

  const dirPath = CachesDirectoryPath;
  const destinationPrefix = Platform.OS === 'ios' ? '' : 'file://';

  const newId = getUniqueId(video);

  const commandFileName = `thumb%04d-${newId}.png`;
  const commandDestinationUri = `${destinationPrefix}${dirPath}/${commandFileName}`;

  const resultFileName = `thumb0001-${newId}.png`;
  const destinationUri = `${destinationPrefix}${dirPath}/${resultFileName}`;

  if (await exists(destinationUri)) {
    return new OdinBlob(destinationUri, { type: 'image/png' });
  }

  // MDN docs (https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API/Transcoding_assets_for_MSE#fragmenting)
  // FFMPEG fragmenting: https://ffmpeg.org/ffmpeg-formats.html#Fragmentation
  const command = `-i ${source} -frames:v 1 ${commandDestinationUri}`;
  // throw new Error('FFmpegKit is not available currently.');
  try {
    const session = await FFmpegKit.execute(command);
    const state = await session.getState();
    const returnCode = await session.getReturnCode();
    // const failStackTrace = await session.getFailStackTrace();
    // const output = await session.getOutput();

    if (state === SessionState.FAILED || !returnCode.isValueSuccess()) {
      throw new Error(`FFmpeg process failed with state: ${state} and rc: ${returnCode}.`);
    }

    const thumbBlob = new OdinBlob(destinationUri, { type: 'image/png' });
    await new Promise<void>((resolve, reject) => {
      let intervalCount = 0;
      const interval = setInterval(async () => {
        intervalCount++;
        if (thumbBlob.written) {
          clearInterval(interval);
          resolve();
        }
        if (intervalCount > 200) {
          clearInterval(interval);
          reject(
            '[RNVideoProviderSegmenter] grabThumbnail: Timeout while waiting for thumbnail to be written.'
          );
        }
      }, 100);
    });
    return thumbBlob;
  } catch (error) {
    console.error(`FFmpeg process failed with error: ${error}`);
    return null;
  }
};

interface VideoData {
  video: ImageSource;
  metadata: PlainVideoMetadata | SegmentedVideoMetadata;
}

interface HLSData {
  segments: ImageSource;
  metadata: HlsVideoMetadata;
  keyHeader?: KeyHeader;
}

export const compressAndSegmentVideo = async (
  video: ImageSource,
  compress?: boolean,
  onUpdate?: (progress: number) => void,
  keyHeader?: KeyHeader
): Promise<VideoData | HLSData> => {
  const compressedVideo = compress
    ? await CompressVideo(video, (progress) => onUpdate?.(progress / 1.5))
    : undefined;
  const fragmentedVideo = (await segmentVideo(compressedVideo || video, keyHeader)) || video;

  onUpdate?.(1);

  const playlistOrFullVideo: ImageSource | null =
    (fragmentedVideo as HLSVideo).playlist || fragmentedVideo;

  if ('segments' in fragmentedVideo) {
    const playlistcontent = await readFile(
      (fragmentedVideo as HLSVideo).playlist.uri as string,
      'utf8'
    );

    const metadata: HlsVideoMetadata = {
      isSegmented: true,
      mimeType: 'application/vnd.apple.mpegurl',
      hlsPlaylist: playlistcontent,
      duration: playlistOrFullVideo?.playableDuration ? Math.round(playlistOrFullVideo.playableDuration * 1000) : 0,
    };

    return {
      segments: (fragmentedVideo as HLSVideo).segments,
      metadata,
    };
  }

  const metadata: PlainVideoMetadata = {
    mimeType: playlistOrFullVideo.type || 'video/mp4',
    fileSize: playlistOrFullVideo?.fileSize || 0,
    isSegmented: false,
    duration: playlistOrFullVideo?.playableDuration ? Math.round(playlistOrFullVideo.playableDuration * 1000) : 0,

  };
  return {
    metadata,
    video: fragmentedVideo,
  };
};
