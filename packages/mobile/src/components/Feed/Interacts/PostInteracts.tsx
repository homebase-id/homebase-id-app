import {
  ApiType,
  DotYouClient,
  HomebaseFile,
  ParsedReactionPreview,
} from '@youfoundation/js-lib/core';
import { PostContent, ReactionContext } from '@youfoundation/js-lib/public';
import { memo } from 'react';
import { IconButton } from '../../Chat/Chat-app-bar';
import { View } from 'react-native';
import { OpenHeart, Comment, ShareNode } from '../../ui/Icons/icons';
import { CanReactInfo, useCanReact, useReaction } from '../../../hooks/reactions';
import { useDotYouClientContext } from 'feed-app-common';
import { EmojiSummary } from './EmojiSummary';
import { CommentTeaserList } from './CommentsTeaserList';
import { ShareContext } from './Share/ShareModal';
import { ErrorNotification } from '../../ui/Alert/ErrorNotification';

export const PostInteracts = memo(
  ({
    postFile,
    onCommentPress,
    onReactionPress,
    onSharePress,
  }: {
    postFile: HomebaseFile<PostContent>;
    isPublic?: boolean;
    onCommentPress?: (context: ReactionContext & CanReactInfo) => void;
    onReactionPress?: (context: ReactionContext) => void;
    onSharePress?: (context: ShareContext) => void;
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

    const {
      saveEmoji: { mutate: postEmoji, error: postEmojiError },
      // removeEmoji: { mutate: removeEmoji, error: removeEmojiError },
    } = useReaction();

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

    const onLike = () =>
      postEmoji({
        emojiData: {
          authorOdinId: owner || '',
          body: '❤️',
        },
        context: reactionContext,
      });

    const onCommentPressHandler = () => {
      const context: ReactionContext & CanReactInfo = {
        ...reactionContext,
        ...canReact,
      };
      return onCommentPress?.(context);
    };

    const permalink = `${new DotYouClient({ identity: authorOdinId || undefined, api: ApiType.Guest }).getRoot()}/posts/${postContent.channelId}/${
      postContent.slug ?? postContent.id
    }`;

    const onSharePressHandler = () => {
      const context: ShareContext = {
        href: permalink,
        title: postContent.caption,
      };
      return onSharePress?.(context);
    };

    return (
      <>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {!postDisabledEmoji && <IconButton icon={<OpenHeart />} onPress={onLike} />}
          <ErrorNotification error={postEmojiError} />
          <EmojiSummary
            context={reactionContext}
            onReactionPress={() => onReactionPress?.(reactionContext)}
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
            <IconButton icon={<ShareNode />} onPress={onSharePressHandler} />
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
