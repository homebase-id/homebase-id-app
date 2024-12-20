import { ImageSource } from '../image/RNImageProvider';
import { jsonStringify64 } from '@homebase-id/js-lib/helpers';

import { VideoContentType } from '@homebase-id/js-lib/media';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import {
  EmbeddedThumb,
  ImageContentType,
  KeyHeader,
  PayloadFile,
  ThumbnailFile,
  GenerateKeyHeader,
} from '@homebase-id/js-lib/core';
import { createThumbnails } from '../image/RNThumbnailProvider';
import { grabThumbnail, compressAndSegmentVideo } from './RNVideoSegmenter';
import { unlink } from 'react-native-fs';

export const processVideo = async (
  video: ImageSource,
  payloadKey: string,
  compress?: boolean,
  onUpdate?: (phase: string, progress: number) => void,
  aesKey?: Uint8Array
): Promise<{
  tinyThumb: EmbeddedThumb | undefined;
  payloads: PayloadFile[];
  thumbnails: ThumbnailFile[];
}> => {
  const keyHeader: KeyHeader | undefined = aesKey ? GenerateKeyHeader(aesKey) : undefined;

  const payloads: PayloadFile[] = [];
  const thumbnails: ThumbnailFile[] = [];

  // Grab thumbnail
  onUpdate?.('Grabbing thumbnail', 0);
  const thumbnail = await grabThumbnail(video);
  const thumbSource: ImageSource | null = thumbnail
    ? {
        uri: thumbnail.uri,
        width: video.width || 0,
        height: video.height || 0,
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

  // Cleanup thumb
  if (thumbnail) {
    try {
      await unlink(thumbnail.uri);
    } catch {}
  }

  // Compress and segment video
  const { metadata, ...videoData } = await compressAndSegmentVideo(
    video,
    compress,
    onUpdate ? (progress) => onUpdate('Compressing', progress) : undefined,
    keyHeader
  );

  if ('segments' in videoData) {
    // HLS
    const { segments } = videoData;

    const segmentsBlob = new OdinBlob((segments.filepath || segments.uri) as string, {
      type: 'video/mp2t' as VideoContentType,
    }) as unknown as Blob;

    payloads.push({
      key: payloadKey,
      payload: segmentsBlob,
      descriptorContent: jsonStringify64(metadata),

      ...(keyHeader && keyHeader.iv
        ? { skipEncryption: true, iv: keyHeader.iv }
        : { skipEncryption: false }),
    });
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
  };
};
