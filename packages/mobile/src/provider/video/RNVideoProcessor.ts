import { ImageSource } from '../image/RNImageProvider';
import { jsonStringify64, stringToUint8Array } from '@homebase-id/js-lib/helpers';

import { VideoContentType } from '@homebase-id/js-lib/media';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import {
  EmbeddedThumb,
  ImageContentType,
  KeyHeader,
  PayloadFile,
  ThumbnailFile,
  GenerateKeyHeader,
  MAX_PAYLOAD_DESCRIPTOR_BYTES,
  DEFAULT_PAYLOAD_DESCRIPTOR_KEY,
} from '@homebase-id/js-lib/core';
import { createThumbnails } from '../image/RNThumbnailProvider';
import { grabThumbnail, compressAndSegmentVideo } from './RNVideoSegmenter';
import { unlink } from 'react-native-fs';

export const processVideo = async (
  video: ImageSource,
  payloadKey: string,
  descriptorKey?: string,
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
        { quality: 100, maxPixelDimension: 320, maxBytes: 26 * 1024 },
      ])
      : { tinyThumb: undefined, additionalThumbnails: undefined };

  if (additionalThumbnails) {
    thumbnails.push(...additionalThumbnails);
  }

  // Cleanup thumb
  if (thumbnail) {
    try {
      await unlink(thumbnail.uri);
    } catch { }
  }

  // Compress and segment video
  const { metadata, ...videoData } = await compressAndSegmentVideo(
    video,
    compress,
    onUpdate ? (progress) => onUpdate('Compressing', progress) : undefined,
    keyHeader
  );

  // get the metadata size
  const shouldEmbedContent = jsonStringify64(metadata).length < MAX_PAYLOAD_DESCRIPTOR_BYTES;

  const descriptorContent = shouldEmbedContent ? jsonStringify64(metadata) : jsonStringify64({
    mimeType: metadata.mimeType,
    isSegmented: metadata.isSegmented,
    isDescriptorContentComplete: false,
    fileSize: metadata.fileSize,
    key: descriptorKey || DEFAULT_PAYLOAD_DESCRIPTOR_KEY,
  });


  if ('segments' in videoData) {
    // HLS
    const { segments } = videoData;

    const segmentsBlob = new OdinBlob((segments.filepath || segments.uri) as string, {
      type: 'video/mp2t' as VideoContentType,
    }) as unknown as Blob;

    payloads.push({
      key: payloadKey,
      payload: segmentsBlob,
      descriptorContent: descriptorContent,

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
      descriptorContent: descriptorContent,
    });
  }

  if (!shouldEmbedContent) {
    payloads.push({
      key: descriptorKey || DEFAULT_PAYLOAD_DESCRIPTOR_KEY,
      payload: new OdinBlob([stringToUint8Array(jsonStringify64(metadata))], { type: 'application/json' }) as unknown as Blob,
      descriptorContent: undefined,
      skipEncryption: false,
    });
  }

  return {
    tinyThumb,
    thumbnails,
    payloads,
  };
};
