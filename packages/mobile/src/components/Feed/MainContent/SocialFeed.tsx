import { HomebaseFile } from '@youfoundation/js-lib/core';
import { useSocialFeed } from '../../../hooks/feed/useSocialFeed';
import { PostContent } from '@youfoundation/js-lib/public';
import { useMemo } from 'react';
import { flattenInfinteData } from '../../../utils/utils';
import { Text } from '../../ui/Text/Text';
import { formatToTimeAgoWithRelativeDetail, t } from 'feed-app-common';
import Animated from 'react-native-reanimated';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { View } from 'react-native';
import { AuthorName } from '../../ui/Name';

const PAGE_SIZE = 10;

const SocialFeedMainContent = () => {
  const {
    data: posts,
    hasNextPage: hasMorePosts,
    isLoading: postsLoading,
    fetchNextPage,
    isFetchingNextPage,
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

  if (postsLoading) {
    return <Text>Loading...</Text>;
  }
  if (flattenedPosts?.length === 0) {
    return (
      <Text>
        {t('No posts yet, send a post to your followers, or start following other identities')}
      </Text>
    );
  }
  return (
    <Animated.FlatList
      data={flattenedPosts}
      keyExtractor={(item) => item.fileId}
      renderItem={({ item }) => <Post postFile={item} />}
      onEndReached={() => hasMorePosts && fetchNextPage()}
    />
  );
};

const Post = ({ postFile }: { postFile: HomebaseFile<PostContent> }) => {
  const post = postFile.fileMetadata.appData.content;
  const { isDarkMode } = useDarkMode();
  const created = new Date(postFile.fileMetadata.created);
  const now = new Date();
  const date = new Date(postFile?.fileMetadata.appData.userDate || now);
  const yearsAgo = Math.abs(new Date(now.getTime() - date.getTime()).getUTCFullYear() - 1970);
  const format: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: yearsAgo !== 0 ? 'numeric' : undefined,
    hour: 'numeric',
    minute: 'numeric',
  };

  return (
    <Animated.View
      style={{
        padding: 10,
        margin: 10,
        elevation: 5,
        backgroundColor: isDarkMode ? Colors.black : Colors.white,
        borderRadius: 5,
        flexDirection: 'column',
      }}
    >
      <View style={{}}>
        <Text>
          <AuthorName odinId={post.authorOdinId} />
        </Text>
        <Text>{date.toLocaleDateString(undefined, format)}</Text>
      </View>
      <Text
        style={{
          fontSize: 16,
        }}
      >
        {post.caption}
      </Text>
    </Animated.View>
  );
};

export default SocialFeedMainContent;
