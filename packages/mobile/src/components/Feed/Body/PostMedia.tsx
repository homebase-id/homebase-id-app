import { HomebaseFile } from '@youfoundation/js-lib/core';
import { getChannelDrive, PostContent } from '@youfoundation/js-lib/public';
import { memo } from 'react';
import { calculateScaledDimensions } from '../../../utils/utils';
import { Dimensions } from 'react-native';
import { MediaGallery, MediaItem } from '../../ui/Media/MediaGallery';

type PostMediaProps = {
  post: HomebaseFile<PostContent>;
};

export const PostMedia = memo(({ post }: PostMediaProps) => {
  const payloads = post.fileMetadata.payloads;
  const fileId = post.fileId;
  const previewThumbnail = post.fileMetadata.appData.previewThumbnail;
  const odinId = post.fileMetadata.senderOdinId;
  const authorOdinId = post.fileMetadata.appData.content.authorOdinId || odinId;
  const { width, height } = Dimensions.get('screen');
  if (payloads?.length === 0) return null;
  if (payloads.length === 1) {
    const payload = payloads[0];
    const aspectRatio = (previewThumbnail?.pixelWidth || 1) / (previewThumbnail?.pixelHeight || 1);

    const { width: newWidth, height: newHeight } = calculateScaledDimensions(
      previewThumbnail?.pixelWidth || 300,
      previewThumbnail?.pixelHeight || 300,
      { width: width * 0.9, height: height * 0.9 }
    );
    return (
      <MediaItem
        fileId={fileId}
        payload={payload}
        globalTransitId={post.fileMetadata.globalTransitId}
        probablyEncrypted={post.fileMetadata.isEncrypted}
        odinId={authorOdinId}
        targetDrive={getChannelDrive(post.fileMetadata.appData.content.channelId)}
        fit={'cover'}
        previewThumbnail={previewThumbnail}
        imageSize={{
          width: newWidth,
          height: newHeight,
        }}
        style={{
          aspectRatio,
        }}
        onClick={() => {
          //
        }}
        onLongPress={undefined}
      />
    );
  }
  return (
    <MediaGallery
      fileId={fileId}
      targetDrive={getChannelDrive(post.fileMetadata.appData.content.channelId)}
      globalTransitId={post.fileMetadata.globalTransitId}
      payloads={payloads}
      odinId={authorOdinId}
      probablyEncrypted={post.fileMetadata.isEncrypted}
      previewThumbnail={previewThumbnail}
    />
  );
});
