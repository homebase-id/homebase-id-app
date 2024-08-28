import {
  ApiType,
  DotYouClient,
  HomebaseFile,
  ParsedReactionPreview,
} from '@homebase-id/js-lib/core';
import { PostContent, ReactionContext } from '@homebase-id/js-lib/public';
import { memo, useCallback, useMemo, useState } from 'react';
import { IconButton } from '../../Chat/Chat-app-bar';
import { GestureResponderEvent, View } from 'react-native';
import { OpenHeart, Comment, ShareNode, SolidHeart } from '../../ui/Icons/icons';
import {
  CanReactInfo,
  useCanReact,
  useMyEmojiReactions,
  useReaction,
} from '../../../hooks/reactions';
import { useDotYouClientContext } from 'feed-app-common';
import { EmojiSummary } from './EmojiSummary';
import { CommentTeaserList } from './CommentsTeaserList';
import { ShareContext } from './Share/ShareModal';
import { ErrorNotification } from '../../ui/Alert/ErrorNotification';
import { Colors } from '../../../app/Colors';
import { PostReactionBar } from './Reactions/PostReactionBar';

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

    const postDisabledEmoji = useMemo(
      () =>
        postContent.reactAccess !== undefined &&
        (postContent.reactAccess === false || postContent.reactAccess === 'comment'),
      [postContent.reactAccess]
    );

    const postDisabledComment = useMemo(
      () =>
        postContent.reactAccess !== undefined &&
        (postContent.reactAccess === false || postContent.reactAccess === 'emoji'),
      [postContent.reactAccess]
    );

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

    const permalink = useMemo(
      () =>
        `${new DotYouClient({ identity: authorOdinId || undefined, api: ApiType.Guest }).getRoot()}/posts/${postContent.channelId}/${
          postContent.slug ?? postContent.id
        }`,
      [authorOdinId, postContent]
    );

    const onSharePressHandler = () => {
      const context: ShareContext = {
        href: permalink,
        title: postContent.caption,
      };
      return onSharePress?.(context);
    };

    if (!postFile.fileMetadata.globalTransitId || !postFile.fileId) return null;

    return (
      <>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {!postDisabledEmoji && <LikeButton context={reactionContext} canReact={canReact} />}
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

export const LikeButton = ({
  context,
  canReact,
}: {
  context: ReactionContext;
  canReact?: CanReactInfo;
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
        icon={isLiked ? <SolidHeart color={Colors.red[500]} /> : <OpenHeart />}
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
      />
    </>
  );
};
