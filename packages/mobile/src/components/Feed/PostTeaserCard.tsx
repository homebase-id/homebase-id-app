import { View } from 'react-native';
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
import { HomebaseFile, SecurityGroupType } from '@youfoundation/js-lib/core';
import { PostContent, ReactionContext } from '@youfoundation/js-lib/public';
import { useChannel } from '../../hooks/feed/channels/useChannel';
import { useSocialChannel } from '../../hooks/feed/useSocialChannel';
import { Colors } from '../../app/Colors';
import { PostInteracts } from './Interacts/PostInteracts';
import { CanReactInfo } from '../../hooks/reactions';
import { PostMeta } from './Meta/Meta';

export const PostTeaserCard = memo(
  ({
    postFile,
    onCommentPress,
  }: {
    postFile: HomebaseFile<PostContent>;
    onCommentPress: (context: ReactionContext & CanReactInfo) => void;
  }) => {
    const post = postFile.fileMetadata.appData.content;
    const { isDarkMode } = useDarkMode();
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

    const channel = externalChannel || internalChannel;

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
            marginBottom: 8,
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
            <PostMeta
              postFile={postFile}
              channel={channel || undefined}
              odinId={odinId}
              authorOdinId={authorOdinId}
            />
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
        <PostInteracts
          postFile={postFile}
          onCommentPress={onCommentPress}
          isPublic={
            channel?.serverMetadata?.accessControlList?.requiredSecurityGroup ===
              SecurityGroupType.Anonymous ||
            channel?.serverMetadata?.accessControlList?.requiredSecurityGroup ===
              SecurityGroupType.Authenticated
          }
        />
      </Animated.View>
    );
  }
);
