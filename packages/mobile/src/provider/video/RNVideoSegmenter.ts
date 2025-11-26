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
// const getVideoCodec = async (inputFilePath: string) => {
//   return new Promise((resolve, reject) => {
//     // Command to get codec information
//     const command = `-v error -select_streams v:0 -show_entries stream=codec_name -of default=noprint_wrappers=1 ${inputFilePath}`;

//     // throw new Error('FFmpegKit is not available currently.');
//     FFprobeKit.execute(command)
//       .then(async (session) => {
//         const state = await session.getState();
//         const returnCode = await session.getReturnCode();
//         const output = await session.getOutput();

//         if (state === SessionState.FAILED || !returnCode.isValueSuccess()) {
//           reject(new Error(`FFmpeg process failed with state: ${state} and rc: ${returnCode}`));
//         } else {
//           // Process output to extract codec name
//           const codec = output.trim().split('=')[1];
//           resolve(codec);
//         }
//       })
//       .catch((error) => {
//         reject(new Error(`FFmpeg process failed with error: ${error}`));
//       });
//   });
// };

// Proper ffprobe side_data_list JSON structure (only what we need)
interface FfprobeSideData {
  side_data_type: string;
  rotation?: string; // ffprobe outputs rotation as string like "-90"
}

interface FfprobeStream {
  side_data_list?: FfprobeSideData[];
}

interface FfprobeOutput {
  streams?: FfprobeStream[];
  side_data_list?: FfprobeSideData[]; // sometimes it's at root level
}

const getRotationFromFile = async (filePath: string): Promise<number> => {
  try {
    const session = await FFprobeKit.execute(
      `-v quiet -select_streams v:0 -show_entries side_data_list=side_data_type,rotation -of json=compact=1 "${filePath}"`
    );

    const output = await session.getOutput();
    if (!output?.trim()) return 0;

    let data: FfprobeOutput;
    try {
      data = JSON.parse(output) as FfprobeOutput;
    } catch {
      console.warn('Failed to parse ffprobe JSON:', output);
      return 0;
    }

    // Try stream-level side data first, then root-level (some ffprobe versions differ)
    const sideDataList: FfprobeSideData[] | undefined =
      data.streams?.[0]?.side_data_list ?? data.side_data_list;

    if (!Array.isArray(sideDataList)) return 0;

    const displayEntry = sideDataList.find(
      (entry): entry is FfprobeSideData & { rotation: string } =>
        entry.side_data_type === 'Display Matrix' && typeof entry.rotation === 'string'
    );

    if (!displayEntry) return 0;

    const rotation = parseInt(displayEntry.rotation);

    // Final sanity check
    return isNaN(rotation) || rotation < -360 || rotation > 360 ? 0 : rotation;
  } catch (error) {
    console.warn('getRotationFromFile failed:', error);
    return 0;
  }
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

    const sourceFileSize = await stat(source).then((s) => s.size);
    if (sourceFileSize < 5 * MB) {
      return { ...video };
    }

    const dirPath = CachesDirectoryPath;
    const prefix = Platform.OS === 'ios' ? '' : 'file://';
    const playlistUri = `${prefix}${dirPath}/ffmpeg-segmented-${getNewId()}.m3u8`;
    const segmentUri = playlistUri.replace('.m3u8', '.ts');

    // === ROTATION DETECTION ===
    const rotation = await getRotationFromFile(source);
    const absRot = Math.abs(((rotation % 360) + 360) % 360);
    const needsRotationFix = absRot === 90 || absRot === 270;

    // === ENCRYPTION SETUP ===
    const { keyInfoUri, pathsToClean } = await (async () => {
      if (keyHeader) {
        const keyUri = `${prefix}${dirPath}/hls-encryption.key`;
        const keyInfoUri = `${prefix}${dirPath}/hls-key_inf.txt`;

        await writeFile(keyUri, uint8ArrayToBase64(keyHeader.aesKey), 'base64');
        const keyInfo = `http://example.com/key\n${keyUri}\n${toHexString(keyHeader.iv)}`;
        await writeFile(keyInfoUri, keyInfo, 'utf8');

        return { keyInfoUri, pathsToClean: [keyUri, keyInfoUri] };
      }
      return { keyInfoUri: undefined, pathsToClean: [] };
    })();

    const encryptionArgs = keyHeader ? ['-hls_key_info_file', keyInfoUri!] : [];

    // === BUILD COMMAND ===
    let commandArgs: string[] = [];

    if (!needsRotationFix) {
      // Pure copy — fastest, no rotation needed
      commandArgs = [
        '-i', source,
        '-codec:v', 'copy',
        '-codec:a', 'copy',
        ...encryptionArgs,
        '-hls_time', '6',
        '-hls_list_size', '0',
        '-hls_flags', 'single_file',
        '-f', 'hls',
        playlistUri,
      ];
    } else {
      // Re-encode only when rotated → preserves rotation + smaller file
      commandArgs = [
        '-i', source,
        '-c:v', 'libx264',
        '-preset', 'veryfast',     // ultrafast → veryfast = huge size win, still fast
        '-crf', '23',
        '-g', '30',                // 1-second GOP → enables B-frames
        '-bf', '2',                // allow 2 B-frames → massive compression gain
        '-c:a', 'copy',
        ...encryptionArgs,
        '-hls_time', '6',
        '-hls_list_size', '0',
        '-hls_flags', 'single_file',
        '-f', 'hls',
        playlistUri,
      ];
    }

    const command = commandArgs.join(' ');
    console.log('FFmpeg command:', command);

    const session = await FFmpegKit.execute(command);
    const state = await session.getState();
    const returnCode = await session.getReturnCode();

    if (state === SessionState.FAILED || !returnCode?.isValueSuccess()) {
      const logs = await session.getLogs();
      console.error('FFmpeg failed:', logs.map(l => l.getMessage()).join('\n'));
      throw new Error(`FFmpeg failed: ${state}, rc: ${returnCode}`);
    }

    // Cleanup
    try {
      pathsToClean.forEach(path => unlink(path).catch(() => { }));
      if (video.filepath) unlink(video.filepath).catch(() => { });
    } catch (e) {
      console.warn('Cleanup failed', e);
    }

    return {
      playlist: {
        ...video,
        uri: playlistUri,
        filepath: playlistUri,
        type: 'application/vnd.apple.mpegurl',
        fileSize: await stat(playlistUri).then(s => s.size),
      },
      segments: {
        ...video,
        uri: segmentUri,
        filepath: segmentUri,
        type: 'video/mp2t',
      },
    };
  } catch (ex) {
    console.error('failed to segment video', ex);
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
