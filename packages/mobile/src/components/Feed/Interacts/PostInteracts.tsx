import { ApiType, DotYouClient, HomebaseFile } from '@homebase-id/js-lib/core';
import {
  CommentsReactionSummary,
  parseReactionPreview,
  PostContent,
  ReactionContext,
} from '@homebase-id/js-lib/public';
import { memo, useCallback, useMemo, useState } from 'react';
import { GestureResponderEvent, View } from 'react-native';
import { OpenHeart, Comment, ShareNode } from '../../ui/Icons/icons';
import {
  CanReactInfo,
  useCanReact,
  useCommentSummary,
  useMyEmojiReactions,
  useReaction,
} from '../../../hooks/reactions';
import { t, useDotYouClientContext } from 'feed-app-common';
import { EmojiSummary } from './EmojiSummary';
import { CommentTeaserList } from './CommentsTeaserList';
import { ShareContext } from './Share/ShareModal';
import { ErrorNotification } from '../../ui/Alert/ErrorNotification';

import { PostReactionBar } from './Reactions/PostReactionBar';
import { IconButton } from '../../ui/Buttons';
import { Text } from '../../ui/Text/Text';
import { Colors } from '../../../app/Colors';
import { useDarkMode } from '../../../hooks/useDarkMode';

export const PostInteracts = memo(
  ({
    postFile,
    onCommentPress,
    onReactionPress,
    onSharePress,
    onEmojiModalOpen,
    isPublic,
    showCommentPreview = true,
    showSummary,
  }: {
    postFile: HomebaseFile<PostContent>;
    isPublic?: boolean;
    onCommentPress?: (context: ReactionContext & CanReactInfo) => void;
    onReactionPress?: (context: ReactionContext) => void;
    onSharePress?: (context: ShareContext) => void;
    onEmojiModalOpen?: (context: ReactionContext) => void;
    showCommentPreview?: boolean;
    showSummary?: boolean;
  }) => {
    const postContent = postFile.fileMetadata.appData.content;
    const owner = useDotYouClientContext().getIdentity();
    const authorOdinId = postFile.fileMetadata.senderOdinId || owner;
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

    const reactionContext: ReactionContext = useMemo(() => {
      return {
        authorOdinId: authorOdinId,
        channelId: postContent.channelId,
        target: {
          globalTransitId: postFile.fileMetadata.globalTransitId || '',
          fileId: postFile.fileId,
          isEncrypted: postFile.fileMetadata.isEncrypted || false,
        },
      };
    }, [authorOdinId, postContent.channelId, postFile]);

    const onCommentPressHandler = useCallback(() => {
      const context: ReactionContext & CanReactInfo = {
        ...reactionContext,
        ...canReact,
      };
      return onCommentPress?.(context);
    }, [canReact, onCommentPress, reactionContext]);

    const onEmojiPressHandler = useCallback(() => {
      return onEmojiModalOpen?.(reactionContext);
    }, [reactionContext, onEmojiModalOpen]);

    const onReactionPressHandler = useCallback(() => {
      return onReactionPress?.(reactionContext);
    }, [onReactionPress, reactionContext]);

    const permalink = useMemo(
      () =>
        `${new DotYouClient({ identity: authorOdinId || undefined, api: ApiType.Guest }).getRoot()}/posts/${postContent.channelId}/${
          postContent.slug ?? postContent.id
        }`,
      [authorOdinId, postContent]
    );

    const parsedReactionPreview = useMemo(
      () => parseReactionPreview(postFile.fileMetadata.reactionPreview),
      [postFile.fileMetadata.reactionPreview]
    );

    const onSharePressHandler = useCallback(() => {
      const context: ShareContext = {
        href: permalink,
        title: postContent.caption,
      };
      return onSharePress?.(context);
    }, [onSharePress, permalink, postContent.caption]);

    if (!postFile.fileMetadata.globalTransitId || !postFile.fileId) return null;

    return (
      <>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {!postDisabledEmoji && (
            <LikeButton
              context={reactionContext}
              canReact={canReact}
              onEmojiModalOpen={onEmojiPressHandler}
            />
          )}
          <EmojiSummary
            context={reactionContext}
            onReactionPress={onReactionPressHandler}
            reactionPreview={parsedReactionPreview.reactions}
          />
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
              justifyContent: 'flex-end',
            }}
          >
            {isPublic && (
              <IconButton
                icon={<ShareNode />}
                onPress={onSharePressHandler}
                touchableProps={{
                  disabled: !onSharePress,
                }}
              />
            )}
            {!postDisabledComment && (
              <IconButton
                icon={<Comment />}
                onPress={onCommentPressHandler}
                touchableProps={{
                  disabled: !onCommentPress,
                }}
              />
            )}
            {showSummary ? (
              <CommentSummary
                context={reactionContext}
                reactionPreview={parsedReactionPreview.comments}
              />
            ) : null}
          </View>
        </View>
        {showCommentPreview && (
          <CommentTeaserList
            reactionPreview={parsedReactionPreview.comments}
            onExpand={onCommentPressHandler}
          />
        )}
      </>
    );
  }
);

export const LikeButton = memo(
  ({
    context,
    canReact,
    onEmojiModalOpen,
  }: {
    context: ReactionContext;
    canReact?: CanReactInfo;
    onEmojiModalOpen?: () => void;
  }) => {
    const identity = useDotYouClientContext().getIdentity();
    const {
      saveEmoji: { mutate: postEmoji, error: postEmojiError },
      removeEmoji: { mutate: removeEmoji, error: removeEmojiError },
    } = useReaction();

    const { data: myEmojis } = useMyEmojiReactions(context).fetch;

    const [reactionBarVisible, setReactionBarVisible] = useState<{
      isActive: boolean;
      coordinates?: {
        x: number;
        y: number;
      };
    }>({ isActive: false });

    const doLike = () =>
      postEmoji({
        emojiData: {
          authorOdinId: identity || '',
          body: '❤️',
        },
        context,
      });

    const doUnlike = () =>
      removeEmoji({
        emojiData: { body: '❤️', authorOdinId: identity || '' },
        context,
      });

    const isLiked = myEmojis?.some((reaction) => reaction === '❤️');

    const onLongPress = (e: GestureResponderEvent) => {
      const y = e.nativeEvent.pageY - e.nativeEvent.locationY;
      setReactionBarVisible({
        isActive: true,
        coordinates: {
          x: e.nativeEvent.locationX,
          y,
        },
      });
    };

    return (
      <>
        <ErrorNotification error={postEmojiError || removeEmojiError} />
        <IconButton
          icon={<OpenHeart />}
          onPress={isLiked ? doUnlike : doLike}
          touchableProps={{
            onLongPress: onLongPress,
          }}
        />

        <PostReactionBar
          context={context}
          canReact={canReact}
          isActive={reactionBarVisible.isActive}
          coordinates={reactionBarVisible.coordinates}
          onClose={() => setReactionBarVisible({ isActive: false })}
          onEmojiModalOpen={onEmojiModalOpen}
        />
      </>
    );
  }
);

export const CommentSummary = ({
  context,
  reactionPreview,
}: {
  context: ReactionContext;
  reactionPreview?: CommentsReactionSummary;
}) => {
  const { data: totalCount } = useCommentSummary({
    authorOdinId: context.authorOdinId,
    channelId: context.channelId,
    postGlobalTransitId: context.target.globalTransitId,
    reactionPreview: reactionPreview,
  }).fetch;
  const { isDarkMode } = useDarkMode();

  return totalCount ? (
    <>
      <Text
        style={{
          fontSize: 15,
          opacity: 0.7,
          fontWeight: '500',
          alignSelf: 'center',
        }}
      >
        ·{'  '}
        <Text
          style={{
            color: Colors.indigo[isDarkMode ? 200 : 500],
          }}
        >
          {totalCount} {(totalCount || 0) > 1 ? t('comments') : t('comment')}
        </Text>
      </Text>
    </>
  ) : null;
};
