import { RawReactionContent, ReactionContext } from '@youfoundation/js-lib/public';
import { CanReactInfo, useReaction } from '../../../../hooks/reactions';
import {
  CommentReactionPreview,
  HomebaseFile,
  NewHomebaseFile,
  ReactionFile,
} from '@youfoundation/js-lib/core';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar } from '../../../ui/Avatars/Avatar';
import { Text } from '../../../ui/Text/Text';
import { AuthorName } from '../../../ui/Name';
import { ellipsisAtMaxChar, t } from 'feed-app-common';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { Colors } from '../../../../app/Colors';

export interface CommentProps {
  context: ReactionContext;
  canReact?: CanReactInfo;
  commentData: HomebaseFile<ReactionFile> | NewHomebaseFile<RawReactionContent>;
  isThread: boolean;
  onReply?: () => void;
}

export interface dirtyReactionContext extends Omit<ReactionContext, 'target'> {
  target: {
    fileId?: string;
    globalTransitId?: string;
    isEncrypted: boolean;
  };
}

export const Comment = ({ context, canReact, commentData, onReply, isThread }: CommentProps) => {
  const [isReply, setIsReply] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const {
    saveComment: { mutateAsync: postComment, error: postCommentError, status: postState },
    removeComment: { mutateAsync: removeComment, error: removeCommentError },
  } = useReaction();

  const fileId = commentData.fileId;
  const commentContent = commentData.fileMetadata.appData.content;
  const authorOdinId = commentContent.authorOdinId;

  const threadContext: dirtyReactionContext = {
    ...context,
    target: {
      fileId: commentData.fileId,
      globalTransitId: (commentData as HomebaseFile<ReactionFile>).fileMetadata.globalTransitId,
      isEncrypted: (commentData as HomebaseFile<ReactionFile>).fileMetadata.isEncrypted || false,
    },
  };

  const doUpdate = (newBody: string, newAttachment?: File) => {
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
  };
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 16,
        marginHorizontal: 8,
        marginVertical: 12,
      }}
    >
      <Avatar
        odinId={authorOdinId}
        imageSize={{
          width: 36,
          height: 36,
        }}
        style={{
          width: 36,
          height: 36,
        }}
      />
      <View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            opacity: 0.7,
            marginBottom: 4,
          }}
        >
          <AuthorName odinId={authorOdinId} />
        </Text>
        <Text>{commentContent.body}</Text>
      </View>
    </View>
  );
};

const MAX_CHAR_FOR_SUMMARY = 280;

export const CommentTeaser = ({ commentData }: { commentData: CommentReactionPreview }) => {
  const { authorOdinId, body, mediaPayloadKey } = commentData;
  const hasMedia = !!mediaPayloadKey;
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={{
        flexDirection: 'row',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '700',
          opacity: 0.7,
        }}
      >
        <AuthorName odinId={authorOdinId} />{' '}
      </Text>
      {commentData.isEncrypted && body === '' ? (
        <View
          style={{
            marginLeft: 2,
            borderRadius: 4,
            backgroundColor: isDarkMode ? Colors.slate[700] : Colors.slate[200],
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
};