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
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { CommentModalMethods, CommentsModal } from '../Interacts/Comments/CommentsModal';
import { CanReactInfo } from '../../../hooks/reactions';

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

  if (postsLoading) {
    return <FeedLoader />;
  }

  return (
    <BottomSheetModalProvider>
      <Animated.FlatList
        data={flattenedPosts}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.fileId}
        renderItem={({ item }) => (
          <PostTeaserCard postFile={item} onCommentPress={onCommentPress} />
        )}
        ListEmptyComponent={<EmptyFeed />}
        ListFooterComponent={isFetchingNextPage ? <FeedLoader /> : null}
        onEndReached={() => hasMorePosts && fetchNextPage()}
        onEndReachedThreshold={0.3}
      />
      <CommentsModal ref={commentRef} />
    </BottomSheetModalProvider>
  );
});

export default SocialFeedMainContent;
