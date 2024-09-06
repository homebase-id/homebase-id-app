import { EmbeddedThumb, ReactionFile } from '@homebase-id/js-lib/core';
import {
  GetTargetDriveFromChannelId,
  RawReactionContent,
  ReactionContext,
} from '@homebase-id/js-lib/public';
import { Text } from '../../../ui/Text/Text';
import { memo } from 'react';
import { CommentMedia } from './CommentMedia';

export const CommentBody = memo(
  ({
    context,
    commentFileId,
    commentLastModifed,
    content,
    previewThumbnail,
  }: {
    context?: ReactionContext;
    commentFileId?: string;
    commentLastModifed?: number;
    content: RawReactionContent | ReactionFile;
    previewThumbnail?: EmbeddedThumb;
  }) => {
    const { body } = content;
    const sourceTargetDrive = context && GetTargetDriveFromChannelId(context.channelId);
    return (
      <>
        <Text style={{ flex: 1 }}>{body}</Text>
        {content.mediaPayloadKey && context && (
          <CommentMedia
            fileId={commentFileId}
            postAuthorOdinId={context.authorOdinId}
            targetDrive={sourceTargetDrive}
            fileKey={content.mediaPayloadKey}
            lastModified={commentLastModifed}
            previewThumbnail={previewThumbnail}
            probablyEncrypted={context.target.isEncrypted}
          />
        )}
      </>
    );
  }
);
