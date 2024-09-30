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
import { CommentEditor } from './CommentComposer';
import { Asset } from 'react-native-image-picker';

export const CommentBody = memo(
  ({
    context,
    commentFileId,
    commentLastModifed,
    content,
    previewThumbnail,
    updateState,
    onUpdate,
    onCancel,
    isEdit,
  }: {
    context?: ReactionContext;
    commentFileId?: string;
    commentLastModifed?: number;
    content: RawReactionContent | ReactionFile;
    previewThumbnail?: EmbeddedThumb;
    isEdit?: boolean;
    updateState: 'pending' | 'loading' | 'success' | 'error' | 'idle';
    onUpdate?: (commentBody: string, attachment?: Asset) => void;
    onCancel?: () => void;
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

    if (isEdit && onUpdate) {
      return (
        <CommentEditor
          defaultBody={body}
          doPost={onUpdate}
          onCancel={onCancel}
          postState={updateState}
        />
      );
    }

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
            postAuthorOdinId={context.odinId}
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
