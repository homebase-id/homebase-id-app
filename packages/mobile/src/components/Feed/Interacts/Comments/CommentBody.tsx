import { EmbeddedThumb, ReactionFile } from '@homebase-id/js-lib/core';
import {
  GetTargetDriveFromChannelId,
  RawReactionContent,
  ReactionContext,
} from '@homebase-id/js-lib/public';
import { memo, useMemo } from 'react';
import { CommentMedia } from './CommentMedia';
import { openURL, URL_PATTERN } from '../../../../utils/utils';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import ParsedText, { ParseShape } from 'react-native-parsed-text';
import { Colors } from '../../../../app/Colors';

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

    const { isDarkMode } = useDarkMode();

    const parse: ParseShape[] = useMemo(
      () => [
        {
          pattern: URL_PATTERN,
          onPress: (url) => openURL(url),
          style: {
            color: isDarkMode ? Colors.indigo[200] : Colors.indigo[500],
          },
        },
      ],
      [isDarkMode]
    );

    return (
      <>
        <ParsedText
          parse={parse}
          style={{ flex: 1, color: isDarkMode ? Colors.white : Colors.black }}
        >
          {body}
        </ParsedText>
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
