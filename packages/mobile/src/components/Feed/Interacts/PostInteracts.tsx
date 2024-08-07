import { HomebaseFile, ParsedReactionPreview } from '@youfoundation/js-lib/core';
import { PostContent, ReactionContext } from '@youfoundation/js-lib/public';
import { memo } from 'react';
import { IconButton } from '../../Chat/Chat-app-bar';
import { View } from 'react-native';
import { OpenHeart, Forward, Comment } from '../../ui/Icons/icons';
import { CanReactInfo, useCanReact } from '../../../hooks/reactions';
import { useDotYouClientContext } from 'feed-app-common';
import { EmojiSummary } from './EmojiSummary';
import { CommentTeaserList } from './CommentsTeaserList';

export const PostInteracts = memo(
  ({
    postFile,
    onCommentPress,
  }: {
    postFile: HomebaseFile<PostContent>;
    isPublic?: boolean;
    onCommentPress?: (context: ReactionContext & CanReactInfo) => void;
  }) => {
    const postContent = postFile.fileMetadata.appData.content;
    const owner = useDotYouClientContext().getIdentity();
    const authorOdinId = postContent.authorOdinId || owner;
    const postDisabledEmoji =
      postContent.reactAccess !== undefined &&
      (postContent.reactAccess === false || postContent.reactAccess === 'comment');
    const postDisabledComment =
      postContent.reactAccess !== undefined &&
      (postContent.reactAccess === false || postContent.reactAccess === 'emoji');
    const { data: canReact } = useCanReact({
      authorOdinId,
      channelId: postContent.channelId,
      postContent: postContent,
      isEnabled: true,
      isAuthenticated: true,
      isOwner: false,
    });

    if (!postFile.fileMetadata.globalTransitId || !postFile.fileId) return null;

    const reactionContext: ReactionContext = {
      authorOdinId: authorOdinId,
      channelId: postContent.channelId,
      target: {
        globalTransitId: postFile.fileMetadata.globalTransitId,
        fileId: postFile.fileId,
        isEncrypted: postFile.fileMetadata.isEncrypted || false,
      },
    };

    const onCommentPressHandler = () => {
      const context: ReactionContext & CanReactInfo = {
        ...reactionContext,
        ...canReact,
      };
      return onCommentPress?.(context);
    };

    return (
      <>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {!postDisabledEmoji && <IconButton icon={<OpenHeart />} />}
          <EmojiSummary
            context={reactionContext}
            reactionPreview={
              (postFile.fileMetadata.reactionPreview as ParsedReactionPreview)?.reactions
            }
          />
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
              justifyContent: 'flex-end',
            }}
          >
            <IconButton icon={<Forward />} />
            {!postDisabledComment && (
              <IconButton icon={<Comment />} onPress={onCommentPressHandler} />
            )}
          </View>
        </View>
        <CommentTeaserList
          reactionPreview={
            (postFile.fileMetadata.reactionPreview as ParsedReactionPreview).comments
          }
          onExpand={onCommentPressHandler}
        />
      </>
    );
  }
);
