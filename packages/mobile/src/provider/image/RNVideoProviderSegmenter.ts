import { ImageSource } from './RNImageProvider';
import { getNewId } from '@youfoundation/js-lib/helpers';

import RNFS from 'react-native-fs';
import { Video } from 'react-native-compressor';
import { Platform } from 'react-native';

import MP4Box from 'mp4box';
import { FFmpegKit, SessionState } from 'ffmpeg-kit-react-native';
import { SegmentedVideoMetadata } from '@youfoundation/js-lib/media';
import { OdinBlob } from '../../../polyfills/OdinBlob';

const CompressVideo = async (video: ImageSource): Promise<ImageSource> => {
  try {
    const source = video.filepath || video.uri;

    if (!source || !(await RNFS.exists(source))) {
      throw new Error(`File not found: ${source}`);
    }

    const resultUri = await Video.compress(
      source,
      {
        compressionMethod: 'manual',
        maxSize: 1280,
        bitrate: 3000000,
      },
      (progress) => {
        if (Math.round(progress * 100) % 10 === 0) {
          console.log(`Compression Progress: ${progress}`);
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

const MB = 1000000;
const FragmentVideo = async (video: ImageSource) => {
  try {
    const source = video.filepath || video.uri;

    if (!source || !(await RNFS.exists(source))) {
      throw new Error(`File not found: ${source}`);
    }

    const sourceFileSize = await RNFS.stat(source).then((stats) => stats.size);
    if (sourceFileSize < 10 * MB) {
      return {
        ...video,
      };
    }

    const dirPath = RNFS.CachesDirectoryPath;

    const destinationPrefix = Platform.OS === 'ios' ? '' : 'file://';
    const destinationUri = `${destinationPrefix}${dirPath}/ffmpeg-fragmented-${getNewId()}.mp4`;

    // MDN docs (https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API/Transcoding_assets_for_MSE#fragmenting)
    // FFMPEG fragmenting: https://ffmpeg.org/ffmpeg-formats.html#Fragmentation
    const command = `-i ${source} -c:v copy -c:a copy -movflags frag_keyframe+empty_moov+default_base_moof ${destinationUri}`;

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

      if (state === SessionState.FAILED || !returnCode.isValueSuccess()) {
        throw new Error(`FFmpeg process failed with state: ${state} and rc: ${returnCode}.`);
      }

      const fileSize = await RNFS.stat(destinationUri).then((stats) => stats.size);

      return {
        ...video,
        fileSize: fileSize || video.fileSize,
        uri: destinationUri,
        filepath: destinationUri,
      };
    } catch (error) {
      throw new Error(`FFmpeg process failed with error: ${error}`);
    }
  } catch (ex) {
    console.error('failed to fragment video', ex);
    return video;
  }
};

export const grabThumbnail = async (video: ImageSource) => {
  const source = video.filepath || video.uri;

  if (!source || !(await RNFS.exists(source))) {
    console.error(`File not found: ${source}`);
    return null;
  }

  const dirPath = RNFS.CachesDirectoryPath;
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
    await new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        if (thumbBlob.written) {
          clearInterval(interval);
          resolve();
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

  if (!source || !(await RNFS.exists(source))) {
    throw new Error(`File not found: ${source}`);
  }

  const stat = await RNFS.stat(source);

  const mp4File = MP4Box.createFile(true);

  // eslint-disable-next-line no-async-promise-executor
  return new Promise<Mp4Info>(async (resolve, reject) => {
    mp4File.onError = (e: Error) => reject(e);
    mp4File.onReady = (info: Mp4Info) => resolve(info);

    const readChunkSize = 8192;
    let offset = 0;
    // let totalBytesRead = 0;

    while (offset < stat.size) {
      const bytesToRead = Math.min(readChunkSize, stat.size - offset);

      const base64String = await RNFS.read(source, bytesToRead, offset, 'base64');
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

export const processVideo = async (
  video: ImageSource,
  compress?: boolean
): Promise<{ video: ImageSource; metadata: SegmentedVideoMetadata }> => {
  const compressedVideo = compress ? await CompressVideo(video) : undefined;
  const fragmentedVideo = await FragmentVideo(compressedVideo || video);

  const mp4Info = await getMp4Info(video);
  const metadata: SegmentedVideoMetadata = {
    isSegmented: true,
    mimeType: 'video/mp4',
    codec: getCodecFromMp4Info(mp4Info),
    fileSize: fragmentedVideo.fileSize || 0,
    duration: fragmentedVideo.playableDuration ? fragmentedVideo.playableDuration * 1000 : 0,
  };

  return { video: fragmentedVideo, metadata };
};
