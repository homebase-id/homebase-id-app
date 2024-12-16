import { HomebaseFile, NewHomebaseFile, SecurityGroupType } from '@homebase-id/js-lib/core';
import { ChannelDefinition, PostContent, ReactionContext } from '@homebase-id/js-lib/public';
import { memo, useRef } from 'react';
import { ActivityIndicator, Animated, View } from 'react-native';
import { GestureType } from 'react-native-gesture-handler';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { IconButton } from '../../ui/Buttons';
import { DoubleTapHeart } from '../../ui/DoubleTapHeart';
import { Ellipsis } from '../../ui/Icons/icons';
import { AuthorName } from '../../ui/Name';
import { Text } from '../../ui/Text/Text';
import { PostBody } from '../Body/PostBody';
import { PostMedia } from '../Body/PostMedia';
import { PostInteracts } from '../Interacts/PostInteracts';
import { ShareContext } from '../Interacts/Share/ShareModal';
import { PostMeta, ToGroupBlock } from '../Meta/Meta';
import { postTeaserCardStyle } from '../PostTeaserCard';
import { Colors } from '../../../app/Colors';
import { Avatar } from '../../ui/Avatars/Avatar';
import { PostActionProps } from '../Interacts/PostActionModal';
import { useDotYouClientContext } from 'homebase-id-app-common';

export const PostDetailCard = memo(
  ({
    odinId,
    channel,
    postFile,
    onReactionPress,
    onSharePress,
    onMorePress,
    onEmojiModalOpen,
  }: {
    odinId?: string;
    channel?: HomebaseFile<ChannelDefinition> | NewHomebaseFile<ChannelDefinition>;
    postFile?: HomebaseFile<PostContent>;
    onReactionPress: (context: ReactionContext) => void;
    onSharePress: (context: ShareContext) => void;
    onMorePress: (context: PostActionProps) => void;
    onEmojiModalOpen: (context: ReactionContext) => void;
  }) => {
    const { isDarkMode } = useDarkMode();
    const doubleTapRef = useRef<GestureType>();
    const identity = useDotYouClientContext().getLoggedInIdentity();

    if (!postFile) return <ActivityIndicator />;
    const post = postFile.fileMetadata.appData.content;
    const authorOdinId = postFile.fileMetadata.originalAuthor || odinId;
    const isPublic =
      channel?.serverMetadata?.accessControlList?.requiredSecurityGroup ===
        SecurityGroupType.Anonymous ||
      channel?.serverMetadata?.accessControlList?.requiredSecurityGroup ===
        SecurityGroupType.Authenticated;
    const groupPost = authorOdinId !== (odinId || identity) && (odinId || identity) && authorOdinId;
    const showPrimaryMedia = post.primaryMediaFile && post.type === 'Article';
    const onPostActionPress = () => {
      onMorePress?.({
        odinId: odinId || postFile.fileMetadata.senderOdinId,
        postFile,
        channel,
        isGroupPost: !!groupPost,
        isAuthor: authorOdinId === identity,
      });
    };

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
          <IconButton icon={<Ellipsis />} onPress={onPostActionPress} />
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
          <PostMedia
            post={postFile}
            gestureRefs={[doubleTapRef]}
            showPrimaryMedia={showPrimaryMedia}
          />
        </DoubleTapHeart>
        <PostInteracts
          postFile={postFile}
          // onCommentPress={onCommentPress}
          onReactionPress={onReactionPress}
          onSharePress={onSharePress}
          onEmojiModalOpen={onEmojiModalOpen}
          isPublic={isPublic}
          showCommentPreview={false}
          showSummary
        />
      </Animated.View>
    );
  }
);
