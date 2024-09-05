import { ImageSource } from './RNImageProvider';
import {
  getNewId,
  getRandom16ByteArray,
  jsonStringify64,
  uint8ArrayToBase64,
} from '@homebase-id/js-lib/helpers';

import { CachesDirectoryPath, exists, read, stat, unlink, writeFile } from 'react-native-fs';
import { Video } from 'react-native-compressor';
import { Platform } from 'react-native';

import MP4Box from 'mp4box';
import { FFmpegKit, SessionState } from 'ffmpeg-kit-react-native';
import { SegmentedVideoMetadata, VideoContentType } from '@homebase-id/js-lib/media';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import {
  EmbeddedThumb,
  ImageContentType,
  KeyHeader,
  PayloadFile,
  ThumbnailFile,
} from '@homebase-id/js-lib/core';
import { createThumbnails } from './RNThumbnailProvider';

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
  segments: ImageSource[];
  keyHeader?: KeyHeader;
}
const segmentVideo = async (
  video: ImageSource,
  encrypt?: boolean
): Promise<ImageSource | HLSVideo | null> => {
  try {
    const source = video.filepath || video.uri;

    if (!source || !(await exists(source))) {
      throw new Error(`File not found: ${source}`);
    }

    const sourceFileSize = await stat(source).then((stats) => stats.size);
    if (sourceFileSize < 10 * MB) {
      return {
        ...video,
      };
    }

    const dirPath = CachesDirectoryPath;
    const destinationPrefix = Platform.OS === 'ios' ? '' : 'file://';

    const { keyHeader, keyInfoUri, pathsToClean } =
      (await (async () => {
        if (encrypt) {
          const keyHeader = {
            iv: getRandom16ByteArray(),
            aesKey: getRandom16ByteArray(),
          };

          const keyUrl = 'http://example.com/path/to/encryption.key';
          const keyUri = `${destinationPrefix}${dirPath}/hls-encryption.key`;
          // const ivUri = `${destinationPrefix}${dirPath}/hls-iv.bin`;
          const keyInfoUri = `${destinationPrefix}${dirPath}/hls-key_inf.txt`;

          await writeFile(keyUri, uint8ArrayToBase64(keyHeader.aesKey), 'base64');

          const keyInfo = `${keyUrl}\n${keyUri}\n${toHexString(keyHeader.iv)}`;

          await writeFile(keyInfoUri, keyInfo, 'utf8');

          return { keyHeader, keyInfoUri, pathsToClean: [keyUri, keyInfoUri] };
        }
      })()) || {};

    const playlistUri = `${destinationPrefix}${dirPath}/ffmpeg-segmented-${getNewId()}.m3u8`;
    const encryptionInfo = encrypt
      ? `-hls_key_info_file ${keyInfoUri}` // -hls_enc 1`
      : '';

    // MDN docs (https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API/Transcoding_assets_for_MSE#fragmenting)
    // FFMPEG fragmenting: https://ffmpeg.org/ffmpeg-formats.html#Fragmentation
    // const command = `-i ${source} -c:v copy -c:a copy -movflags frag_keyframe+empty_moov+default_base_moof ${destinationUri}`;
    const command = `-i ${source} -codec: copy ${encryptionInfo} -hls_time 10 -hls_list_size 0 -f hls ${playlistUri}`;

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

      const segments: string[] = [];
      for (let i = 0; i < 100; i++) {
        const fragmentUri = `${playlistUri.replace('.m3u8', `${i}.ts`)}`;
        if (!(await exists(fragmentUri))) {
          break;
        }
        segments.push(fragmentUri);
      }

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
        segments: await Promise.all(
          segments.map(async (segment) => {
            const segmentFileSize = await stat(playlistUri).then((stats) => stats.size);

            return {
              ...video,
              fileSize: segmentFileSize || video.fileSize,
              type: 'video/mp2t',
              uri: segment,
              filepath: segment,
            };
          })
        ),
        keyHeader,
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
  metadata: SegmentedVideoMetadata;
}

interface HLSData {
  playlist: ImageSource;
  segments: ImageSource[];
  metadata: SegmentedVideoMetadata;
  keyHeader?: KeyHeader;
}

const compressAndSegmentVideo = async (
  video: ImageSource,
  compress?: boolean,
  onUpdate?: (progress: number) => void,
  encrypt?: boolean
): Promise<VideoData | HLSData> => {
  const compressedVideo = compress
    ? await CompressVideo(video, (progress) => onUpdate?.(progress / 1.5))
    : undefined;
  const fragmentedVideo = (await segmentVideo(compressedVideo || video, encrypt)) || video;
  onUpdate?.(1);

  const playlistOrFullVideo: ImageSource | null =
    (fragmentedVideo as HLSVideo).playlist || fragmentedVideo;

  const mp4Info = await getMp4Info(video);
  const metadata: SegmentedVideoMetadata = {
    isSegmented: true,
    mimeType: playlistOrFullVideo.type || 'video/mp4',
    codec: getCodecFromMp4Info(mp4Info),
    fileSize: playlistOrFullVideo?.fileSize || 0,
    duration: playlistOrFullVideo?.playableDuration
      ? playlistOrFullVideo.playableDuration * 1000
      : 0,
  };

  if ('segments' in fragmentedVideo) {
    return {
      playlist: (fragmentedVideo as HLSVideo).playlist,
      segments: (fragmentedVideo as HLSVideo).segments,
      keyHeader: (fragmentedVideo as HLSVideo).keyHeader,
      metadata,
    };
  }

  return {
    metadata,
    video: fragmentedVideo,
  };
};

export const processVideo = async (
  video: ImageSource,
  payloadKey: string,
  compress?: boolean,
  onUpdate?: (phase: string, progress: number) => void,
  encrypt?: boolean
): Promise<{
  tinyThumb: EmbeddedThumb | undefined;
  payloads: PayloadFile[];
  thumbnails: ThumbnailFile[];
  keyHeader?: KeyHeader;
}> => {
  let keyHeader: KeyHeader | undefined;
  const payloads: PayloadFile[] = [];
  const thumbnails: ThumbnailFile[] = [];

  // Grab thumbnail
  onUpdate?.('Grabbing thumbnail', 0);
  const thumbnail = await grabThumbnail(video);
  const thumbSource: ImageSource | null = thumbnail
    ? {
        uri: thumbnail.uri,
        width: 1920, //thumbnail.width || 1920,
        height: 1080, //thumbnail.height || 1080,
        type: thumbnail.type,
      }
    : null;
  const { tinyThumb, additionalThumbnails } =
    thumbSource && thumbnail
      ? await createThumbnails(thumbSource, payloadKey, thumbnail.type as ImageContentType, [
          { quality: 100, width: 250, height: 250 },
        ])
      : { tinyThumb: undefined, additionalThumbnails: undefined };
  if (additionalThumbnails) {
    thumbnails.push(...additionalThumbnails);
  }

  // Compress and segment video
  const { metadata, ...videoData } = await compressAndSegmentVideo(
    video,
    compress,
    onUpdate ? (progress) => onUpdate('Compressing', progress) : undefined,
    encrypt
  );

  if ('segments' in videoData) {
    // HLS
    const { playlist, segments } = videoData;
    keyHeader = videoData.keyHeader;
    const playlistBlob = new OdinBlob(playlist.uri, {
      type: playlist.type as VideoContentType,
    }) as unknown as Blob;

    payloads.push({
      key: payloadKey,
      payload: playlistBlob,
      descriptorContent: jsonStringify64(metadata),
    });

    for (let j = 0; j < segments.length; j++) {
      const segment = segments[j];
      const segmentBlob = new OdinBlob(segment.uri, {
        type: segment.type as VideoContentType,
      }) as unknown as Blob;

      thumbnails.push({
        key: payloadKey,
        payload: segmentBlob,
        pixelHeight: j,
        pixelWidth: j,
        skipEncryption: true,
      });
    }
  } else {
    // Custom blob to avoid reading and writing the file to disk again
    const payloadBlob = new OdinBlob((videoData.video.filepath || videoData.video.uri) as string, {
      type: 'video/mp4' as VideoContentType,
    }) as unknown as Blob;

    payloads.push({
      key: payloadKey,
      payload: payloadBlob,
      descriptorContent: metadata ? jsonStringify64(metadata) : undefined,
    });
  }

  return {
    tinyThumb,
    thumbnails,
    payloads,
    keyHeader,
  };
};
