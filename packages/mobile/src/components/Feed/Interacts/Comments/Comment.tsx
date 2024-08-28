import { RawReactionContent, ReactionContext } from '@homebase-id/js-lib/public';
import { CanReactInfo, useReaction } from '../../../../hooks/reactions';
import {
  CommentReactionPreview,
  HomebaseFile,
  NewHomebaseFile,
  ReactionFile,
} from '@homebase-id/js-lib/core';
import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '../../../ui/Avatars/Avatar';
import { Text } from '../../../ui/Text/Text';
import { AuthorName } from '../../../ui/Name';
import { ellipsisAtMaxChar, t } from 'feed-app-common';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { Colors } from '../../../../app/Colors';
import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';
import { CommentHead } from './CommentHead';
import { CommentMeta } from './CommentMeta';
import { CommentThread } from './CommentThread';

export interface CommentProps {
  context: ReactionContext;
  canReact?: CanReactInfo;
  commentData: HomebaseFile<ReactionFile> | NewHomebaseFile<RawReactionContent>;
  isThread: boolean;
  onReply?: (replyComment: HomebaseFile<ReactionFile>) => void;
}

export interface dirtyReactionContext extends Omit<ReactionContext, 'target'> {
  target: {
    fileId?: string;
    globalTransitId?: string;
    isEncrypted: boolean;
  };
}

export const Comment = memo(
  ({ context, canReact, commentData, onReply, isThread }: CommentProps) => {
    const [isEdit, setIsEdit] = useState(false);
    const {
      saveComment: { mutateAsync: postComment, error: postCommentError, status: postState },
      removeComment: { mutateAsync: removeComment, error: removeCommentError },
    } = useReaction();

    const fileId = commentData.fileId;
    const commentContent = commentData.fileMetadata.appData.content;
    const authorOdinId = commentContent.authorOdinId;

    const threadContext: dirtyReactionContext = useMemo(() => {
      return {
        ...context,
        target: {
          fileId: commentData.fileId,
          globalTransitId: (commentData as HomebaseFile<ReactionFile>).fileMetadata.globalTransitId,
          isEncrypted:
            (commentData as HomebaseFile<ReactionFile>).fileMetadata.isEncrypted || false,
        },
      };
    }, [commentData, context]);

    const doUpdate = useCallback(
      (newBody: string, newAttachment?: File) => {
        (async () => {
          await postComment({
            context,
            commentData: {
              ...commentData,
              fileMetadata: {
                ...commentData.fileMetadata,
                appData: {
                  ...commentData.fileMetadata.appData,

                  content: {
                    ...commentData.fileMetadata.appData.content,
                    body: newBody,
                    attachment: newAttachment,
                  },
                },
              },
            },
          });

          setIsEdit(false);
        })();
      },
      [commentData, context, postComment]
    );
    return (
      <View style={styles.container}>
        <ErrorNotification error={postCommentError || removeCommentError} />
        <Avatar odinId={authorOdinId} imageSize={styles.imageSize} style={styles.imageSize} />
        <View style={{ flex: 1 }}>
          <CommentHead
            authorOdinId={authorOdinId}
            setIsEdit={setIsEdit}
            onRemove={
              commentData.fileId
                ? () =>
                    removeComment({
                      context,
                      commentFile: commentData as HomebaseFile<ReactionFile>,
                    })
                : undefined
            }
          />
          {/* TODO: Comement Body */}
          <Text style={{ flex: 1 }}>{commentContent.body}</Text>
          {threadContext.target.fileId && threadContext.target.globalTransitId ? (
            <CommentMeta
              canReact={canReact}
              threadContext={threadContext as ReactionContext}
              created={(commentData as HomebaseFile<ReactionFile>).fileMetadata.created}
              updated={(commentData as HomebaseFile<ReactionFile>).fileMetadata.updated}
              onReply={
                isThread ? undefined : () => onReply?.(commentData as HomebaseFile<ReactionFile>)
              }
            />
          ) : null}
          {!isThread && threadContext.target.fileId && threadContext.target.globalTransitId ? (
            <>
              <CommentThread context={threadContext as ReactionContext} canReact={canReact} />
            </>
          ) : null}
        </View>
      </View>
    );
  }
);

const MAX_CHAR_FOR_SUMMARY = 280;

export const CommentTeaser = memo(({ commentData }: { commentData: CommentReactionPreview }) => {
  const { authorOdinId, body, mediaPayloadKey } = commentData;
  const hasMedia = !!mediaPayloadKey;
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={{
        flexDirection: 'row',
      }}
    >
      <Text style={styles.comentAuthorText}>
        <AuthorName odinId={authorOdinId} />{' '}
      </Text>
      {commentData.isEncrypted && body === '' ? (
        <View
          style={{
            marginLeft: 2,
            borderRadius: 4,
            backgroundColor: isDarkMode ? Colors.slate[700] : Colors.slate[200],
            marginBottom: 2,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: isDarkMode ? Colors.slate[700] : Colors.slate[200],
            }}
          >
            {t('Encrypted')}
          </Text>
        </View>
      ) : (
        <>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              opacity: 0.5,
            }}
          >
            {ellipsisAtMaxChar(body, MAX_CHAR_FOR_SUMMARY)}
            {hasMedia && (
              <Text
                style={{
                  fontStyle: 'italic',
                }}
              >
                {t('Click to view image')}
              </Text>
            )}
          </Text>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 8,
    marginVertical: 12,
  },
  imageSize: {
    width: 36,
    height: 36,
  },
  comentAuthorText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    opacity: 0.7,
  },
});
