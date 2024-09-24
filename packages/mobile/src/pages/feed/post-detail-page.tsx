import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FeedStackParamList } from '../../app/FeedStack';
import { Text } from '../../components/ui/Text/Text';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { useChannel } from '../../hooks/feed/channels/useChannel';
import { usePost } from '../../hooks/feed/post/usePost';
import {
  HomebaseFile,
  NewHomebaseFile,
  ReactionFile,
  SecurityGroupType,
} from '@homebase-id/js-lib/core';
import { ChannelDefinition, PostContent, ReactionContext } from '@homebase-id/js-lib/public';
import { useDarkMode } from '../../hooks/useDarkMode';
import Animated from 'react-native-reanimated';
import { Colors } from '../../app/Colors';
import { ActivityIndicator, ListRenderItemInfo, View } from 'react-native';
import { PostMedia } from '../../components/Feed/Body/PostMedia';
import { IconButton } from '../../components/ui/Buttons';
import { Ellipsis } from '../../components/ui/Icons/icons';
import { PostMeta, ToGroupBlock } from '../../components/Feed/Meta/Meta';
import { AuthorName } from '../../components/ui/Name';
import { Avatar } from '../../components/ui/Avatars/Avatar';
import { postTeaserCardStyle } from '../../components/Feed/PostTeaserCard';
import { PostBody } from '../../components/Feed/Body/PostBody';
import { PostInteracts } from '../../components/Feed/Interacts/PostInteracts';
import { Host } from 'react-native-portalize';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { GestureType } from 'react-native-gesture-handler';
import { DoubleTapHeart } from '../../components/ui/DoubleTapHeart';
import { useCanReact, useComments } from '../../hooks/reactions';
import { useDotYouClientContext } from 'feed-app-common';
import { Comment } from '../../components/Feed/Interacts/Comments/Comment';
import { CommentsLoader } from '../../components/Feed/Interacts/Comments/CommentsModal';

type PostDetailPageProps = NativeStackScreenProps<FeedStackParamList, 'Post'>;

export const PostDetailPage = ({ route: { params } }: PostDetailPageProps) => {
  const { postKey, channelKey, odinId, postFile, channel } = params;

  // We don't call them if we have postFile and channel with us
  const { data: channelData } = useChannel({ channelKey: !channel ? channelKey : undefined }).fetch;
  const { data: postData, isLoading: postDataLoading } = usePost({
    channelKey: !channel ? channelKey : undefined,
    postKey: !postFile ? postKey : undefined,
    odinId,
  });

  const [replyTo, setReplyThread] = useState<
    | {
        replyThreadId: string | undefined;
        authorOdinId: string;
      }
    | undefined
  >();
  const owner = useDotYouClientContext().getIdentity();
  const authorOdinId = (postFile || postData)?.fileMetadata.senderOdinId || owner;
  const postContent = (postFile || postData)?.fileMetadata.appData.content;

  const { data: canReact } = useCanReact({
    authorOdinId,
    channelId: postContent?.channelId || channelKey,
    postContent: postContent,
    isEnabled: true,
    isAuthenticated: true,
    isOwner: false,
  });

  const reactionContext: ReactionContext | undefined = useMemo(() => {
    const post = postFile || postData;
    if (!postContent || !post) return;
    return {
      authorOdinId: authorOdinId,
      channelId: postContent.channelId,
      target: {
        globalTransitId: post.fileMetadata.globalTransitId || '',
        fileId: post.fileId,
        isEncrypted: (postFile || postData)?.fileMetadata.isEncrypted || false,
      },
    };
  }, [authorOdinId, postContent, postData, postFile]);

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

  if (postDataLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!postFile && !postData) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          Post not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <Host>
        <Animated.FlatList
          data={flattenedComments}
          style={{
            margin: 10,
          }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <PostDetailCard
              postFile={postFile || postData || undefined}
              channel={channel || channelData || undefined}
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
      </Host>
    </SafeAreaView>
  );
};

const PostDetailCard = memo(
  ({
    odinId,
    channel,
    postFile,
  }: {
    odinId?: string;
    channel?: HomebaseFile<ChannelDefinition> | NewHomebaseFile<ChannelDefinition>;
    postFile?: HomebaseFile<PostContent>;
  }) => {
    const { isDarkMode } = useDarkMode();
    const doubleTapRef = useRef<GestureType>();

    if (!postFile) return <ActivityIndicator />;
    const post = postFile.fileMetadata.appData.content;
    const authorOdinId = post.authorOdinId || odinId;
    const isPublic =
      channel?.serverMetadata?.accessControlList?.requiredSecurityGroup ===
        SecurityGroupType.Anonymous ||
      channel?.serverMetadata?.accessControlList?.requiredSecurityGroup ===
        SecurityGroupType.Authenticated;

    return (
      <Animated.View
        style={{
          padding: 10,
          elevation: 5,
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
          borderRadius: 5,
          flexDirection: 'column',
        }}
      >
        <View style={postTeaserCardStyle.header}>
          <Avatar
            odinId={authorOdinId || ''}
            imageSize={postTeaserCardStyle.imageSize}
            style={postTeaserCardStyle.imageSize}
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row' }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '400',
                  opacity: 0.7,
                  color: isDarkMode ? Colors.slate[50] : Colors.slate[900],
                }}
              >
                <AuthorName odinId={post.authorOdinId} />
              </Text>
              <ToGroupBlock
                odinId={odinId}
                authorOdinId={authorOdinId}
                channel={channel || undefined}
              />
            </View>
            <PostMeta
              postFile={postFile}
              channel={channel || undefined}
              odinId={odinId}
              authorOdinId={authorOdinId}
            />
          </View>
          <IconButton icon={<Ellipsis />} />
        </View>
        <PostBody
          post={post}
          odinId={postFile.fileMetadata.senderOdinId}
          fileId={postFile.fileId}
          globalTransitId={postFile.fileMetadata.globalTransitId}
          lastModified={postFile.fileMetadata.updated}
          payloads={postFile.fileMetadata.payloads}
        />
        <DoubleTapHeart
          doubleTapRef={doubleTapRef}
          postFile={postFile}
          odinId={postFile.fileMetadata.senderOdinId}
        >
          <PostMedia post={postFile} doubleTapRef={doubleTapRef} />
        </DoubleTapHeart>
        <PostInteracts
          postFile={postFile}
          // onCommentPress={onCommentPress}
          // onReactionPress={onReactionPress}
          // onSharePress={onSharePress}
          // onEmojiModalOpen={onEmojiModalOpen}
          isPublic={isPublic}
          showCommentPreview={false}
        />
      </Animated.View>
    );
  }
);
