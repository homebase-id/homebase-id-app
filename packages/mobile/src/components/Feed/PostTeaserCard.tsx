import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { PostMedia } from './Body/PostMedia';
import { Text } from '../ui/Text/Text';
import { AuthorName } from '../ui/Name';
import { Avatar } from '../ui/Avatars/Avatar';
import { UnreachableIdentity } from './UnreachableIdentity';
import Animated from 'react-native-reanimated';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { HomebaseFile, NewHomebaseFile, SecurityGroupType } from '@homebase-id/js-lib/core';
import { ChannelDefinition, PostContent, ReactionContext } from '@homebase-id/js-lib/public';
import { useChannel } from '../../hooks/feed/channels/useChannel';
import { Colors } from '../../app/Colors';
import { PostInteracts } from './Interacts/PostInteracts';
import { CanReactInfo } from '../../hooks/reactions';
import { PostMeta, ToGroupBlock } from './Meta/Meta';
import { ShareContext } from './Interacts/Share/ShareModal';
import { Ellipsis } from '../ui/Icons/icons';
import { PostActionProps } from './Interacts/PostActionModal';
import { useDotYouClientContext } from 'feed-app-common';
import { useCheckIdentity } from '../../hooks/checkIdentity/useCheckIdentity';
import { PostBody } from './Body/PostBody';
import { IconButton } from '../ui/Buttons';
import { DoubleTapHeart } from '../ui/DoubleTapHeart';
import { GestureType } from 'react-native-gesture-handler';

export const PostTeaserCard = memo(
  ({
    postFile,
    onCommentPress,
    onReactionPress,
    onSharePress,
    onMorePress,
    onEmojiModalOpen,
  }: {
    postFile: HomebaseFile<PostContent>;
    onCommentPress: (context: ReactionContext & CanReactInfo) => void;
    onReactionPress: (context: ReactionContext) => void;
    onSharePress?: (context: ShareContext) => void;
    onMorePress?: (context: PostActionProps) => void;
    onEmojiModalOpen?: (context: ReactionContext) => void;
  }) => {
    const identity = useDotYouClientContext().getIdentity();
    const post = postFile.fileMetadata.appData.content;
    const odinId = postFile.fileMetadata.senderOdinId;
    const authorOdinId = postFile.fileMetadata.originalAuthor || odinId;
    const isExternal = odinId && odinId !== identity;
    const groupPost = authorOdinId !== (odinId || identity) && (odinId || identity) && authorOdinId;

    const { data: identityAccessible } = useCheckIdentity(isExternal ? odinId : undefined);

    const { data: channel } = useChannel({
      channelKey: post.channelId,
      odinId: isExternal ? odinId : undefined,
    }).fetch;

    const onPostActionPress = useCallback(() => {
      onMorePress?.({
        odinId,
        postFile,
        channel,
        isGroupPost: !!groupPost,
        isAuthor: authorOdinId === identity,
      });
    }, [authorOdinId, channel, groupPost, identity, odinId, onMorePress, postFile]);

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

    // Makes sure that the InnerPostTeaserCard is not re-rendered if the channel is not available yet
    if (!postFile || !channel) return null;

    return (
      <InnerPostTeaserCard
        postFile={postFile}
        channel={channel}
        onCommentPress={onCommentPress}
        onPostActionPress={onPostActionPress}
        onReactionPress={onReactionPress}
        onSharePress={onSharePress}
        onEmojiModalOpen={onEmojiModalOpen}
        isPublic={isPublic}
      />
    );
  }
);

export const InnerPostTeaserCard = memo(
  ({
    postFile,
    channel,
    onCommentPress,
    onReactionPress,
    onSharePress,
    onPostActionPress,
    onEmojiModalOpen,
    isPublic,
  }: {
    postFile: HomebaseFile<PostContent>;
    channel?:
      | NewHomebaseFile<ChannelDefinition>
      | HomebaseFile<ChannelDefinition>
      | undefined
      | null;
    onPostActionPress: () => void;
    onCommentPress: (context: ReactionContext & CanReactInfo) => void;
    onReactionPress: (context: ReactionContext) => void;
    onSharePress?: (context: ShareContext) => void;
    onEmojiModalOpen?: (context: ReactionContext) => void;
    isPublic: boolean;
  }) => {
    const { isDarkMode } = useDarkMode();
    const post = postFile.fileMetadata.appData.content;
    const odinId = postFile.fileMetadata.senderOdinId;
    const authorOdinId = postFile.fileMetadata.originalAuthor || odinId;

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

    // This is neeeded to keep a reference of doubleTapGesture. So this would be used
    // to trigger the double tap animation from the parent component and avoid triggering single Tap
    // or any other gesture until this fails
    const doubleTapRef = useRef<GestureType>();

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
                <AuthorName odinId={authorOdinId} />
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
        <PostBody
          post={post}
          odinId={odinId}
          fileId={postFile.fileId}
          globalTransitId={postFile.fileMetadata.globalTransitId}
          lastModified={postFile.fileMetadata.updated}
          payloads={postFile.fileMetadata.payloads}
        />
        <DoubleTapHeart doubleTapRef={doubleTapRef} postFile={postFile} odinId={odinId}>
          <PostMedia post={postFile} doubleTapRef={doubleTapRef} />
        </DoubleTapHeart>
        <PostInteracts
          postFile={postFile}
          onCommentPress={onCommentPress}
          onReactionPress={onReactionPress}
          onSharePress={onSharePress}
          onEmojiModalOpen={onEmojiModalOpen}
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
