import { ChannelDefinition, PostContent, ReactionContext } from '@homebase-id/js-lib/public';
import { PostActionProps } from '../Interacts/PostActionModal';
import { HomebaseFile, NewHomebaseFile, ReactionFile } from '@homebase-id/js-lib/core';
import Animated from 'react-native-reanimated';
import { PostDetailCard } from '../Detail/PostDetailCard';
import { CommentsLoader } from '../Interacts/Comments/CommentsModal';
import { ShareContext } from '../Interacts/Share/ShareModal';
import { useCallback, useMemo, useState } from 'react';
import { useDotYouClientContext } from 'feed-app-common';
import { useCanReact, useComments } from '../../../hooks/reactions';
import { ListRenderItemInfo } from 'react-native';
import { Comment } from '../Interacts/Comments/Comment';

export type NewType = ReactionContext;

export const PostDetailMainContent = ({
  channel,
  odinId,
  postFile,
  onEmojiModalOpen,
  onMorePress,
  onReactionPress,
  onSharePress,
}: {
  postFile: HomebaseFile<PostContent>;
  odinId?: string;
  channel?: HomebaseFile<ChannelDefinition> | NewHomebaseFile<ChannelDefinition>;
  onEmojiModalOpen: (context: NewType) => void;
  onMorePress: (context: PostActionProps) => void;
  onReactionPress: (context: ReactionContext) => void;
  onSharePress: (context: ShareContext) => void;
}) => {
  const [replyTo, setReplyThread] = useState<
    | {
        replyThreadId: string | undefined;
        authorOdinId: string;
      }
    | undefined
  >();
  const owner = useDotYouClientContext().getIdentity();
  const authorOdinId = postFile.fileMetadata.senderOdinId || owner;
  const postContent = postFile.fileMetadata.appData.content;

  const { data: canReact } = useCanReact({
    authorOdinId,
    channelId: postContent?.channelId,
    postContent: postContent,
    isEnabled: postContent?.channelId ? true : false,
    isAuthenticated: true,
    isOwner: false,
  });

  const reactionContext: ReactionContext | undefined = useMemo(() => {
    return {
      authorOdinId: authorOdinId,
      channelId: postContent.channelId,
      target: {
        globalTransitId: postFile.fileMetadata.globalTransitId || '',
        fileId: postFile.fileId,
        isEncrypted: postFile.fileMetadata.isEncrypted || false,
      },
    };
  }, [authorOdinId, postContent, postFile]);

  const {
    data: comments,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
  } = useComments({ context: reactionContext }).fetch;
  const flattenedComments = comments?.pages.flatMap((page) => page.comments).reverse();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<HomebaseFile<ReactionFile>>) => {
      return (
        <Comment
          commentData={item}
          context={reactionContext as ReactionContext}
          isThread={false}
          canReact={canReact}
          onReply={(commentFile) => {
            setReplyThread({
              replyThreadId: commentFile.fileMetadata.globalTransitId,
              authorOdinId: commentFile.fileMetadata.appData.content.authorOdinId,
            });
          }}
        />
      );
    },
    [canReact, reactionContext]
  );

  const listFooter = useMemo(() => {
    if (isFetchingNextPage) return <CommentsLoader />;
    return <></>;
  }, [isFetchingNextPage]);

  return (
    <>
      <Animated.FlatList
        data={flattenedComments}
        style={{
          margin: 10,
        }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <PostDetailCard
            odinId={odinId}
            postFile={postFile || undefined}
            channel={channel || undefined}
            onEmojiModalOpen={onEmojiModalOpen}
            onReactionPress={onReactionPress}
            onSharePress={onSharePress}
            onMorePress={onMorePress}
          />
        }
        keyExtractor={(item) => item.fileId}
        renderItem={renderItem}
        ListFooterComponent={listFooter}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
      />
      {isLoading && <CommentsLoader />}
    </>
  );
};
