import { HomebaseFile } from '@youfoundation/js-lib/core';
import { useSocialFeed } from '../../../hooks/feed/useSocialFeed';
import { PostContent } from '@youfoundation/js-lib/public';
import { memo, useCallback, useMemo, useState } from 'react';
import { flattenInfinteData, openURL, URL_PATTERN } from '../../../utils/utils';
import { Text } from '../../ui/Text/Text';
import Animated from 'react-native-reanimated';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { ActivityIndicator, View } from 'react-native';
import { AuthorName } from '../../ui/Name';
import { useCheckIdentity, useDotYouClientContext } from 'feed-app-common';
import { IconButton } from '../../Chat/Chat-app-bar';
import { Comment, Forward, OpenHeart } from '../../ui/Icons/icons';
import { EmptyFeed } from './EmptyFeed';
import { Avatar } from '../../ui/Avatars/Avatar';
import ParsedText from 'react-native-parsed-text';
import { PostMedia } from '../Body/PostMedia';
import { RefreshControl } from 'react-native-gesture-handler';
import { useSocialChannel } from '../../../hooks/feed/useSocialChannel';
import { useChannel } from '../../../hooks/feed/channels/useChannel';
import { UnreachableIdentity } from '../UnreachableIdentity';

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFeed();
    setRefreshing(false);
  }, [refreshFeed]);

  if (postsLoading) {
    return <FeedLoader />;
  }
  return (
    <Animated.FlatList
      data={flattenedPosts}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      keyExtractor={(item) => item.fileId}
      renderItem={({ item }) => <Post postFile={item} />}
      ListEmptyComponent={<EmptyFeed />}
      onEndReached={() => hasMorePosts && fetchNextPage()}
    />
  );
});

const Post = memo(({ postFile }: { postFile: HomebaseFile<PostContent> }) => {
  const post = postFile.fileMetadata.appData.content;
  const { isDarkMode } = useDarkMode();
  const now = new Date();
  const odinId = postFile.fileMetadata.senderOdinId;
  const authorOdinId = post.authorOdinId || odinId;
  const identity = useDotYouClientContext().getIdentity();
  const isExternal = odinId && odinId !== identity;

  const { data: identityAccessible } = useCheckIdentity(isExternal ? odinId : undefined);

  const { data: externalChannel } = useSocialChannel({
    odinId: isExternal ? odinId : undefined,
    channelId: post.channelId,
  }).fetch;
  const { data: internalChannel } = useChannel({
    channelId: isExternal ? undefined : post.channelId,
  }).fetch;

  const date = new Date(postFile?.fileMetadata.appData.userDate || now);
  const yearsAgo = Math.abs(new Date(now.getTime() - date.getTime()).getUTCFullYear() - 1970);
  const format: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: yearsAgo !== 0 ? 'numeric' : undefined,
    hour: 'numeric',
    minute: 'numeric',
  };

  if (identityAccessible === false && isExternal) {
    return <UnreachableIdentity postFile={postFile} odinId={odinId} />;
  }

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
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 16,
          marginBottom: 10,
          alignItems: 'center',
        }}
      >
        <Avatar
          odinId={authorOdinId}
          imageSize={{
            height: 40,
            width: 40,
          }}
          style={{
            height: 40,
            width: 40,
          }}
        />

        <View>
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
          <Text
            style={{
              opacity: 0.7,
              fontSize: 13,
              color: isDarkMode ? Colors.slate[50] : Colors.slate[900],
            }}
          >
            {date.toLocaleDateString(undefined, format)}
          </Text>
        </View>
      </View>
      <ParsedText
        style={{
          fontSize: 16,
          color: isDarkMode ? Colors.white : Colors.black,
        }}
        parse={[
          {
            pattern: URL_PATTERN,
            onPress: (url) => openURL(url),
            style: {
              color: isDarkMode ? Colors.indigo[200] : Colors.indigo[500],
            },
          },
        ]}
        selectable
        selectionColor={isDarkMode ? Colors.indigo[700] : Colors.indigo[500]}
      >
        {post.caption}
      </ParsedText>
      <PostMedia post={postFile} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <IconButton icon={<OpenHeart />} />
        <View style={{ display: 'flex', flexDirection: 'row' }}>
          <IconButton icon={<Forward />} />
          <IconButton icon={<Comment />} />
        </View>
      </View>
    </Animated.View>
  );
});

const FeedLoader = () => {
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator
        size="large"
        color={isDarkMode ? Colors.indigo[400] : Colors.indigo[700]}
      />
    </View>
  );
};

export default SocialFeedMainContent;
