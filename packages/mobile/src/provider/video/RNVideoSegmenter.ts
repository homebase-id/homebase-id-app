import { ImageSource } from './RNImageProvider';
import { getNewId, uint8ArrayToBase64 } from '@homebase-id/js-lib/helpers';

import {
  CachesDirectoryPath,
  exists,
  read,
  readFile,
  stat,
  unlink,
  writeFile,
} from 'react-native-fs';
import { Video } from 'react-native-compressor';
import { Platform } from 'react-native';

import MP4Box from 'mp4box';
import { FFmpegKit, SessionState } from 'ffmpeg-kit-react-native';
import {
  HlsVideoMetadata,
  PlainVideoMetadata,
  SegmentedVideoMetadata,
} from '@homebase-id/js-lib/media';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { KeyHeader } from '@homebase-id/js-lib/core';

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
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
};

const MB = 1000000;
interface HLSVideo {
  playlist: ImageSource;
  segments: ImageSource;
}
const segmentVideo = async (
  video: ImageSource,
  keyHeader?: KeyHeader
): Promise<ImageSource | HLSVideo | null> => {
  try {
    const source = video.filepath || video.uri;

    if (!source || !(await exists(source))) {
      throw new Error(`File not found: ${source}`);
    }

    // We disbled the segmentation for now, as we only want to support playback on web of HLS;
    // We can re-enable it when we have confirmed HLS is good

    // const sourceFileSize = await stat(source).then((stats) => stats.size);
    // if (sourceFileSize < 10 * MB) {
    return {
      ...video,
    };
    // }

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

    // MDN docs (https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API/Transcoding_assets_for_MSE#fragmenting)
    // FFMPEG fragmenting: https://ffmpeg.org/ffmpeg-formats.html#Fragmentation
    // const command = `-i ${source} -c:v copy -c:a copy -movflags frag_keyframe+empty_moov+default_base_moof ${destinationUri}`;
    const command = `-i ${source} -codec: copy ${encryptionInfo} -hls_time 6 -hls_list_size 0 -f hls -hls_flags single_file ${playlistUri}`;

    // empty_moov (older version of the above)
    // const command = `-i ${source} -c copy -movflags +frag_keyframe+separate_moof+omit_tfhd_offset+empty_moov ${destinationUri}`;

    // faststart (this doesn't work in firefox)
    // const command = `-i ${source} -c copy -movflags +frag_keyframe+separate_moof+omit_tfhd_offset+faststart ${destinationUri}`;

    try {
      const session = await FFmpegKit.execute(command);
      const state = await session.getState();
      const returnCode = await session.getReturnCode();
      // const failStackTrace = await session.getFailStackTrace();
      // const output = await session.getOutput();
      // console.log('FFmpeg output:', output);

      if (state === SessionState.FAILED || !returnCode.isValueSuccess()) {
        throw new Error(`FFmpeg process failed with state: ${state} and rc: ${returnCode}.`);
      }

      const segmentsUri = playlistUri.replace('.m3u8', '.ts');

      pathsToClean?.forEach(async (path) => {
        unlink(path);
      });

      return {
        playlist: {
          ...video,
          fileSize: (await stat(playlistUri).then((stats) => stats.size)) || video.fileSize,
          type: 'application/vnd.apple.mpegurl',
          uri: playlistUri,
          filepath: playlistUri,
        },
        segments: {
          ...video,
          type: 'video/mp2t',
          uri: segmentsUri,
          filepath: segmentsUri,
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

export const grabThumbnail = async (video: ImageSource) => {
  const source = video.filepath || video.uri;

  if (!source || !(await exists(source))) {
    console.error(`File not found: ${source}`);
    return null;
  }

  const dirPath = CachesDirectoryPath;
  const destinationPrefix = Platform.OS === 'ios' ? '' : 'file://';

  const newId = getNewId();

  const commandFileName = `thumb%04d-${newId}.png`;
  const commandDestinationUri = `${destinationPrefix}${dirPath}/${commandFileName}`;

  const resultFileName = `thumb0001-${newId}.png`;
  const destinationUri = `${destinationPrefix}${dirPath}/${resultFileName}`;

  // MDN docs (https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API/Transcoding_assets_for_MSE#fragmenting)
  // FFMPEG fragmenting: https://ffmpeg.org/ffmpeg-formats.html#Fragmentation
  const command = `-i ${source} -frames:v 1 ${commandDestinationUri}`;

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

interface Mp4Info {
  isFragmented: boolean;
  tracks: {
    id: number;
    nb_samples: number;
    type: string;
    codec: string;
    movie_duration: number;
    movie_timescale: number;
    duration: number;
    timescale: number;
  }[];
  mime: string;
  initial_duration?: number;
  duration: number;
  timescale: number;
  brands: string[];
}

type ExtendedBuffer = ArrayBuffer & { fileStart?: number };

const getMp4Info = async (video: ImageSource) => {
  const source = video.filepath || video.uri;

  if (!source || !(await exists(source))) {
    throw new Error(`File not found: ${source}`);
  }

  const stats = await stat(source);

  const mp4File = MP4Box.createFile(true);

  // eslint-disable-next-line no-async-promise-executor
  return new Promise<Mp4Info>(async (resolve, reject) => {
    mp4File.onError = (e: Error) => reject(e);
    mp4File.onReady = (info: Mp4Info) => resolve(info);

    const readChunkSize = 8192;
    let offset = 0;
    // let totalBytesRead = 0;

    while (offset < stats.size) {
      const bytesToRead = Math.min(readChunkSize, stats.size - offset);

      const base64String = await read(source, bytesToRead, offset, 'base64');
      const rawString = atob(base64String);
      const arrayBuffer = new ArrayBuffer(rawString.length) as ExtendedBuffer;
      const byteArray = new Uint8Array(arrayBuffer);
      for (let i = 0; i < rawString.length; i++) {
        byteArray[i] = rawString.charCodeAt(i);
      }
      // totalBytesRead += rawString.length;

      arrayBuffer.fileStart = offset;
      offset = mp4File.appendBuffer(arrayBuffer);
    }
    mp4File.flush();
  });
};

const getCodecFromMp4Info = (info: Mp4Info): string => {
  let codec = info.mime;
  const avTracks = info.tracks?.filter((trck) => ['video', 'audio'].includes(trck.type));
  if (avTracks?.length > 1) {
    codec = `video/mp4; codecs="${avTracks
      .map((trck) => trck.codec)
      .join(',')}"; profiles="${info.brands.join(',')}"`;
  }

  return codec;
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
  };
  return {
    metadata,
    video: fragmentedVideo,
  };
};
