import { HomebaseFile } from '@homebase-id/js-lib/core';
import { useSocialFeed } from '../../../hooks/feed/useSocialFeed';
import { PostContent, ReactionContext } from '@homebase-id/js-lib/public';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flattenInfinteData } from '../../../utils/utils';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { EmptyFeed } from './EmptyFeed';
import { RefreshControl } from 'react-native-gesture-handler';
import { PostTeaserCard } from '../PostTeaserCard';
import { FeedLoader } from '../Loader/FeedLoader';
import { CommentModalMethods, CommentsModal } from '../Interacts/Comments/CommentsModal';
import { CanReactInfo } from '../../../hooks/reactions';
import { Text } from '../../ui/Text/Text';
import { ListRenderItemInfo } from 'react-native';
import { PostReactionModal, ReactionModalMethods } from '../Interacts/Reactions/PostReactionModal';
import { ShareContext, ShareModal, ShareModalMethods } from '../Interacts/Share/ShareModal';
import { PostActionMethods, PostActionProps, PostModalAction } from '../Interacts/PostActionModal';
import { Host } from 'react-native-portalize';
import { t } from 'homebase-id-app-common';
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
  useScrollToTop,
} from '@react-navigation/native';
import {
  PostEmojiPickerModal,
  PostEmojiPickerModalMethods,
} from '../Interacts/Reactions/PostEmojiPickerModal';

import { ErrorNotification } from '../../ui/Alert/ErrorNotification';
import { FeedStackParamList } from '../../../app/FeedStack';
import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';

const PAGE_SIZE = 10;

const SocialFeedMainContent = memo(() => {
  const {
    fetchAll: {
      data: posts,
      hasNextPage: hasMorePosts,
      isLoading: postsLoading,
      fetchNextPage,
      isFetchingNextPage,
      refetch: refreshFeed,
      error,
    },
    inboxProcessed,
  } = useSocialFeed({ pageSize: PAGE_SIZE });
  const { params } = useRoute<RouteProp<FeedStackParamList, 'Posts'>>();
  const navigation = useNavigation<NavigationProp<FeedStackParamList, 'Posts'>>();
  // Flatten all pages, sorted descending and slice on the max number expected
  const flattenedPosts = useMemo(() => {
    if (!posts) return [];
    return flattenInfinteData<HomebaseFile<PostContent>>(
      posts,
      hasMorePosts ? PAGE_SIZE : undefined, // If we're out of ServerSide pages we don't want to slice
      (a, b) =>
        (b.fileMetadata.appData.userDate || b.fileMetadata.created) -
        (a.fileMetadata.appData.userDate || a.fileMetadata.created)
    );
  }, [hasMorePosts, posts]);

  useEffect(() => {
    if (!params || !flattenedPosts || !inboxProcessed) return;
    const post = flattenedPosts.find((post) =>
      stringGuidsEqual(post.fileMetadata.globalTransitId, params.postKey)
    );

    const postContent = post?.fileMetadata.appData.content;
    navigation.navigate('Post', {
      odinId: post?.fileMetadata.senderOdinId,
      postKey: postContent?.slug || postContent?.id || '',
      channelKey: postContent?.channelId,
    });
  }, [flattenedPosts, inboxProcessed, navigation, params]);

  const [refreshing, setRefreshing] = useState(false);

  /* Refs */
  const scrollRef = useAnimatedRef<Animated.FlatList<unknown>>();
  const commentRef = useRef<CommentModalMethods>(null);
  const reactionRef = useRef<ReactionModalMethods>(null);
  const shareRef = useRef<ShareModalMethods>(null);
  const postActionRef = useRef<PostActionMethods>(null);
  const postEmojiPickerRef = useRef<PostEmojiPickerModalMethods>(null);

  useScrollToTop(scrollRef);

  const onSharePress = useCallback((context: ShareContext) => {
    shareRef.current?.setShareContext(context);
  }, []);

  const onCommentPress = useCallback((context: ReactionContext & Partial<CanReactInfo>) => {
    commentRef.current?.setContext(context);
  }, []);

  const onReactionPress = useCallback((context: ReactionContext) => {
    reactionRef.current?.setContext(context);
  }, []);

  const onMorePress = useCallback((context: PostActionProps) => {
    postActionRef.current?.setContext(context);
  }, []);

  const onEmojiModalOpen = useCallback((context: ReactionContext) => {
    postEmojiPickerRef.current?.setContext(context);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFeed();
    setRefreshing(false);
  }, [refreshFeed]);

  const listFooter = useMemo(() => {
    if (isFetchingNextPage) return <FeedLoader />;

    if (flattenedPosts?.length > 0) {
      return (
        <Text
          style={{
            margin: 16,
            opacity: 0.5,
            fontSize: 15,
            fontStyle: 'italic',
          }}
        >
          {t("No more posts. Expecting more? Make sure you're following them.")}
        </Text>
      );
    }
  }, [flattenedPosts, isFetchingNextPage]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<HomebaseFile<PostContent>>) => (
      <PostTeaserCard
        postFile={item}
        onCommentPress={onCommentPress}
        onReactionPress={onReactionPress}
        onSharePress={onSharePress}
        onMorePress={onMorePress}
        onEmojiModalOpen={onEmojiModalOpen}
      />
    ),
    [onCommentPress, onMorePress, onReactionPress, onSharePress, onEmojiModalOpen]
  );

  const onEndReached = useCallback(
    () => hasMorePosts && fetchNextPage(),
    [hasMorePosts, fetchNextPage]
  );
  const keyExtractor = useCallback(
    (item: HomebaseFile<PostContent>, index: number) =>
      item.fileMetadata.appData.uniqueId || item.fileId || index + '',
    []
  );

  if (postsLoading) return <FeedLoader />;

  return (
    <>
      <ErrorNotification error={error} />
      <Host>
        <Animated.FlatList
          ref={scrollRef}
          data={flattenedPosts}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyFeed />}
          ListFooterComponent={listFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
        />
      </Host>
      <CommentsModal ref={commentRef} />
      <PostReactionModal ref={reactionRef} />
      <ShareModal ref={shareRef} />
      <PostModalAction ref={postActionRef} />
      <PostEmojiPickerModal ref={postEmojiPickerRef} />
    </>
  );
});

export default SocialFeedMainContent;
