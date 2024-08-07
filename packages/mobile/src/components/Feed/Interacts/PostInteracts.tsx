import {
  EmojiReactionSummary,
  HomebaseFile,
  ParsedReactionPreview,
} from '@youfoundation/js-lib/core';
import { PostContent, ReactionContext } from '@youfoundation/js-lib/public';
import { memo } from 'react';
import { IconButton } from '../../Chat/Chat-app-bar';
import { Pressable, View } from 'react-native';
import { OpenHeart, Forward, Comment } from '../../ui/Icons/icons';
import { CanReactInfo, useCanReact, useEmojiSummary } from '../../../hooks/reactions';
import { useDotYouClientContext } from 'feed-app-common';
import { Text } from '../../ui/Text/Text';

export const PostInteracts = memo(
  ({
    postFile,
    isPublic,
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

    return (
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
            <IconButton
              icon={<Comment />}
              onPress={() => {
                const context: ReactionContext & CanReactInfo = {
                  ...reactionContext,
                  ...canReact,
                };
                return onCommentPress?.(context);
              }}
            />
          )}
        </View>
      </View>
    );
  }
);

export const EmojiSummary = ({
  context,
  reactionPreview,
}: {
  context: ReactionContext;

  reactionPreview?: EmojiReactionSummary;
}) => {
  const { data: reactionSummary } = useEmojiSummary({
    context,
    reactionPreview: reactionPreview,
  }).fetch;

  //TODO: Open Reaction Summary Modal
  if (reactionSummary && reactionSummary.totalCount > 0) {
    return (
      <Pressable
        style={{
          flexDirection: 'row',
          gap: 4,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 15,
            opacity: 0.7,
            fontWeight: '500',
          }}
        >
          {reactionSummary.totalCount}
        </Text>
        <Text
          style={{
            fontSize: 15,
          }}
        >
          {reactionSummary.reactions.slice(0, 5).map((reaction) => reaction.emoji + ' ')}
        </Text>
      </Pressable>
    );
  }
};
