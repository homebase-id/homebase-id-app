import { RawReactionContent, ReactionContext } from '@youfoundation/js-lib/public';
import { CanReactInfo, useReaction } from '../../../../hooks/reactions';
import { HomebaseFile, NewHomebaseFile, ReactionFile } from '@youfoundation/js-lib/core';
import { useState } from 'react';
import { View } from 'react-native';
import { Avatar } from '../../../ui/Avatars/Avatar';
import { Text } from '../../../ui/Text/Text';
import { AuthorName } from '../../../ui/Name';

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
        marginHorizontal: 16,
        marginVertical: 12,
      }}
    >
      <Avatar
        odinId={authorOdinId}
        imageSize={{
          width: 40,
          height: 40,
        }}
        style={{
          width: 40,
          height: 40,
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
          <AuthorName odinId={authorOdinId} showYou />
        </Text>
        <Text>{commentContent.body}</Text>
      </View>
    </View>
  );
};
