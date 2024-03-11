import { EmbeddedThumb, TargetDrive } from '@youfoundation/js-lib/core';
import { memo } from 'react';
import { ImageStyle } from 'react-native';
import { OdinImage } from '../OdinImage/OdinImage';

// Memo to performance optimize the FlatList
export const PhotoWithLoader = memo(
  ({
    fileId,
    targetDrive,
    previewThumbnail,
    fit = 'cover',
    imageSize,
    enableZoom,
    fileKey,
    style,
    onClick,
  }: {
    fileId: string;
    fileKey: string;
    targetDrive: TargetDrive;
    previewThumbnail?: EmbeddedThumb;
    fit?: 'cover' | 'contain';
    imageSize?: { width: number; height: number };
    enableZoom?: boolean;
    style?: ImageStyle;
    onClick?: () => void;
  }) => {
    return (
      <OdinImage
        targetDrive={targetDrive}
        fileId={fileId}
        fileKey={fileKey}
        previewThumbnail={previewThumbnail}
        fit={fit}
        imageSize={imageSize}
        enableZoom={enableZoom}
        style={style}
        avoidPayload={false}
        onClick={onClick}
      />
    );
  }
);
