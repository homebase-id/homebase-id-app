import { EmbeddedThumb, TargetDrive } from '@homebase-id/js-lib/core';
import { OdinImage } from '../../../ui/OdinImage/OdinImage';
import { calculateScaledDimensions } from '../../../../utils/utils';
import { memo } from 'react';

export const CommentMedia = memo(
  ({
    postAuthorOdinId,
    targetDrive,
    fileId,
    fileKey,
    lastModified,
    previewThumbnail,
    probablyEncrypted,
  }: {
    postAuthorOdinId?: string;
    targetDrive?: TargetDrive;
    fileId?: string;
    fileKey?: string;
    lastModified?: number;
    previewThumbnail?: EmbeddedThumb;
    probablyEncrypted?: boolean;
  }) => {
    if (!targetDrive) return null;

    const aspectRatio = (previewThumbnail?.pixelWidth || 1) / (previewThumbnail?.pixelHeight || 1);

    const { width: newWidth, height: newHeight } = calculateScaledDimensions(
      previewThumbnail?.pixelWidth || 300,
      previewThumbnail?.pixelHeight || 300,
      { width: 250, height: 150 }
    );

    return (
      <OdinImage
        odinId={postAuthorOdinId}
        fileId={fileId}
        targetDrive={targetDrive}
        fileKey={fileKey}
        lastModified={lastModified}
        previewThumbnail={previewThumbnail}
        probablyEncrypted={probablyEncrypted}
        systemFileType="Comment"
        imageSize={{ width: newWidth, height: newHeight }}
        style={{
          aspectRatio,
        }}
        fit="contain"
      />
    );
  }
);
