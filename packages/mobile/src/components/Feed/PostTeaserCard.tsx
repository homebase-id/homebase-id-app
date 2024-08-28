import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { PostMedia } from './Body/PostMedia';
import ParsedText, { ParseShape } from 'react-native-parsed-text';

import { openURL, URL_PATTERN } from '../../utils/utils';
import { Text } from '../ui/Text/Text';
import { AuthorName } from '../ui/Name';
import { Avatar } from '../ui/Avatars/Avatar';
import { UnreachableIdentity } from './UnreachableIdentity';
import Animated from 'react-native-reanimated';
import { useCheckIdentity, useDotYouClientContext } from 'feed-app-common';
import { memo, useCallback, useMemo } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { HomebaseFile, SecurityGroupType } from '@homebase-id/js-lib/core';
import { PostContent, ReactionContext } from '@homebase-id/js-lib/public';
import { useChannel } from '../../hooks/feed/channels/useChannel';
import { useSocialChannel } from '../../hooks/feed/useSocialChannel';
import { Colors } from '../../app/Colors';
import { PostInteracts } from './Interacts/PostInteracts';
import { CanReactInfo } from '../../hooks/reactions';
import { PostMeta, ToGroupBlock } from './Meta/Meta';
import { ShareContext } from './Interacts/Share/ShareModal';
import { Ellipsis } from '../ui/Icons/icons';
import { IconButton } from '../Chat/Chat-app-bar';
import { PostActionProps } from './Interacts/PostActionModal';

export const PostTeaserCard = memo(
  ({
    postFile,
    onCommentPress,
    onReactionPress,
    onSharePress,
    onMorePress,
  }: {
    postFile: HomebaseFile<PostContent>;
    onCommentPress: (context: ReactionContext & CanReactInfo) => void;
    onReactionPress: (context: ReactionContext) => void;
    onSharePress?: (context: ShareContext) => void;
    onMorePress?: (context: PostActionProps) => void;
  }) => {
    const { isDarkMode } = useDarkMode();
    const identity = useDotYouClientContext().getIdentity();
    const post = postFile.fileMetadata.appData.content;
    const odinId = postFile.fileMetadata.senderOdinId;
    const authorOdinId = post.authorOdinId || odinId;
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
    const groupPost = authorOdinId !== (odinId || identity) && (odinId || identity) && authorOdinId;

    const onPostActionPress = useCallback(() => {
      onMorePress?.({
        odinId,
        postFile,
        channel,
        isGroupPost: !!groupPost,
        isAuthor: authorOdinId === identity,
      });
    }, [authorOdinId, channel, groupPost, identity, odinId, onMorePress, postFile]);

    const parse: ParseShape[] = useMemo(
      () => [
        {
          pattern: URL_PATTERN,
          onPress: (url) => openURL(url),
          style: {
            color: isDarkMode ? Colors.indigo[200] : Colors.indigo[500],
          },
        },
      ],
      [isDarkMode]
    );

    const viewStyle = useMemo(() => {
      return {
        padding: 10,
        margin: 10,
        elevation: 5,
        backgroundColor: isDarkMode ? Colors.black : Colors.white,
        borderRadius: 5,
        flexDirection: 'column',
      } as StyleProp<ViewStyle>;
    }, [isDarkMode]);

    const isPublic = useMemo(
      () =>
        channel?.serverMetadata?.accessControlList?.requiredSecurityGroup ===
          SecurityGroupType.Anonymous ||
        channel?.serverMetadata?.accessControlList?.requiredSecurityGroup ===
          SecurityGroupType.Authenticated,
      [channel]
    );

    if (identityAccessible === false && isExternal) {
      return <UnreachableIdentity postFile={postFile} odinId={odinId} />;
    }

    return (
      <Animated.View style={viewStyle}>
        <View style={styles.header}>
          <Avatar odinId={authorOdinId} imageSize={styles.imageSize} style={styles.imageSize} />
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
          <IconButton icon={<Ellipsis />} onPress={onPostActionPress} />
        </View>
        <ParsedText
          style={{
            fontSize: 16,
            color: isDarkMode ? Colors.white : Colors.black,
          }}
          parse={parse}
        >
          {post.caption}
        </ParsedText>
        <PostMedia post={postFile} />
        <PostInteracts
          postFile={postFile}
          onCommentPress={onCommentPress}
          onReactionPress={onReactionPress}
          onSharePress={onSharePress}
          isPublic={isPublic}
        />
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  imageSize: {
    height: 40,
    width: 40,
  },
});