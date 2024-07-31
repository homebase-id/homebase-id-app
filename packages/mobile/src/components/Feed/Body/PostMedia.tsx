import { HomebaseFile } from '@youfoundation/js-lib/core';
import { BlogConfig, PostContent } from '@youfoundation/js-lib/public';
import { memo } from 'react';
import { OdinImage } from '../../ui/OdinImage/OdinImage';
import { calculateScaledDimensions } from '../../../utils/utils';
import { Dimensions } from 'react-native';
import { MediaGallery } from '../../Chat/MediaMessage';

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
      { width: width * 0.8, height: height * 0.68 }
    );
    return (
      <OdinImage
        fileId={fileId}
        fileKey={payload.key}
        globalTransitId={post.fileMetadata.globalTransitId}
        probablyEncrypted={post.fileMetadata.isEncrypted}
        odinId={authorOdinId}
        targetDrive={BlogConfig.FeedDrive}
        fit={'cover'}
        previewThumbnail={previewThumbnail}
        imageSize={{
          width: newWidth,
          height: newHeight,
        }}
        style={{
          aspectRatio,
        }}
        sharedTransitionTag={payload.key}
      />
    );
  }
  return (
    <MediaGallery
      fileId={fileId}
      targetDrive={BlogConfig.FeedDrive}
      payloads={payloads}
      previewThumbnail={previewThumbnail}
    />
  );
});
