import { HomebaseFile } from '@youfoundation/js-lib/core';
import { useSocialFeed } from '../../../hooks/feed/useSocialFeed';
import { PostContent, ReactionContext } from '@youfoundation/js-lib/public';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { flattenInfinteData } from '../../../utils/utils';
import Animated from 'react-native-reanimated';
import { EmptyFeed } from './EmptyFeed';
import { RefreshControl } from 'react-native-gesture-handler';
import { PostTeaserCard } from '../PostTeaserCard';
import { FeedLoader } from '../Loader/FeedLoader';
import { CommentModalMethods, CommentsModal } from '../Interacts/Comments/CommentsModal';
import { CanReactInfo } from '../../../hooks/reactions';
import { Text } from '../../ui/Text/Text';
import { ListRenderItemInfo } from 'react-native';

const PAGE_SIZE = 10;

const SocialFeedMainContent = memo(() => {
  const {
    data: posts,
    hasNextPage: hasMorePosts,
    isLoading: postsLoading,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refreshFeed,
  } = useSocialFeed({ pageSize: PAGE_SIZE }).fetchAll;

  // Flatten all pages, sorted descending and slice on the max number expected
  const flattenedPosts = useMemo(
    () =>
      flattenInfinteData<HomebaseFile<PostContent>>(
        posts,
        hasMorePosts ? PAGE_SIZE : undefined, // If we're out of ServerSide pages we don't want to slice
        (a, b) =>
          (b.fileMetadata.appData.userDate || b.fileMetadata.created) -
          (a.fileMetadata.appData.userDate || a.fileMetadata.created)
      ),
    [posts]
  );

  const [refreshing, setRefreshing] = useState(false);
  const commentRef = useRef<CommentModalMethods>(null);
  const onCommentPress = useCallback((context: ReactionContext & CanReactInfo) => {
    commentRef.current?.setContext(context);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFeed();
    setRefreshing(false);
  }, [refreshFeed]);

  const listFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return <FeedLoader />;
    }

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
          No more posts. Expecting more? Make sure you&apos;re following them.
        </Text>
      );
    }
  }, [flattenedPosts?.length, isFetchingNextPage]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<HomebaseFile<PostContent>>) => (
      <PostTeaserCard postFile={item} onCommentPress={onCommentPress} />
    ),
    [onCommentPress]
  );

  if (postsLoading) {
    return <FeedLoader />;
  }

  return (
    <>
      <Animated.FlatList
        data={flattenedPosts}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.fileId}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyFeed />}
        ListFooterComponent={listFooter}
        onEndReached={() => hasMorePosts && fetchNextPage()}
        onEndReachedThreshold={0.3}
      />
      <CommentsModal ref={commentRef} />
    </>
  );
});

export default SocialFeedMainContent;