import { View } from 'react-native';
import { IconButton } from '../Chat/Chat-app-bar';
import { Comment, Forward, OpenHeart } from '../ui/Icons/icons';
import { PostMedia } from './Body/PostMedia';
import ParsedText from 'react-native-parsed-text';

import { openURL, URL_PATTERN } from '../../utils/utils';
import { Text } from '../ui/Text/Text';
import { AuthorName } from '../ui/Name';
import { Avatar } from '../ui/Avatars/Avatar';
import { UnreachableIdentity } from './UnreachableIdentity';
import Animated from 'react-native-reanimated';
import { useCheckIdentity, useDotYouClientContext } from 'feed-app-common';
import { memo } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { PostContent } from '@youfoundation/js-lib/public';
import { useChannel } from '../../hooks/feed/channels/useChannel';
import { useSocialChannel } from '../../hooks/feed/useSocialChannel';
import { Colors } from '../../app/Colors';

export const PostTeaserCard = memo(({ postFile }: { postFile: HomebaseFile<PostContent> }) => {
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
