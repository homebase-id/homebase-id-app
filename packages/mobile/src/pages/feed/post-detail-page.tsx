import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FeedStackParamList } from '../../app/FeedStack';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { useChannel } from '../../hooks/feed/channels/useChannel';
import { ReactionContext } from '@homebase-id/js-lib/public';
import { ActivityIndicator } from 'react-native';
import { Host } from 'react-native-portalize';
import { useCallback, useRef } from 'react';
import {
  PostReactionModal,
  ReactionModalMethods,
} from '../../components/Feed/Interacts/Reactions/PostReactionModal';
import {
  ShareContext,
  ShareModal,
  ShareModalMethods,
} from '../../components/Feed/Interacts/Share/ShareModal';
import {
  PostActionMethods,
  PostActionProps,
  PostModalAction,
} from '../../components/Feed/Interacts/PostActionModal';
import {
  PostEmojiPickerModal,
  PostEmojiPickerModalMethods,
} from '../../components/Feed/Interacts/Reactions/PostEmojiPickerModal';
import { PostDetailMainContent } from '../../components/Feed/MainContent/PostDetailMainContent';

import { useReferencedPost } from '../../hooks/feed/useReferencedPost';
import { useDotYouClientContext } from 'homebase-id-app-common';
import { usePost } from '../../hooks/feed/post/usePost';
import { Text } from '../../components/ui/Text/Text';

type PostDetailPageProps = NativeStackScreenProps<FeedStackParamList, 'Post'>;

export const PostDetailPage = ({ route: { params } }: PostDetailPageProps) => {
  const { postKey, channelKey, odinId } = params;
  const reactionRef = useRef<ReactionModalMethods>(null);
  const shareRef = useRef<ShareModalMethods>(null);
  const postActionRef = useRef<PostActionMethods>(null);
  const postEmojiPickerRef = useRef<PostEmojiPickerModalMethods>(null);
  const { data: postFile, isPending } = usePost({
    postKey: postKey,
    channelKey: channelKey,
    odinId,
  });

  const referencedPost = useReferencedPost(!postFile ? postKey : undefined);
  const identity = useDotYouClientContext().getLoggedInIdentity();

  const post = referencedPost || postFile;
  const postOdinId = odinId || post?.fileMetadata.senderOdinId;
  const isExternal = odinId && odinId !== identity;

  const onSharePress = useCallback((context: ShareContext) => {
    shareRef.current?.setShareContext(context);
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

  // We don't call them if we have postFile and channel with us
  const { data: channelData } = useChannel({
    channelKey: channelKey || post?.fileMetadata.appData.content.channelId,
    odinId: isExternal ? postOdinId : undefined,
  }).fetch;

  if (isPending && postKey && !referencedPost && !post) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          Post not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <Host>
        <PostDetailMainContent
          postFile={post}
          channel={channelData || undefined}
          odinId={odinId}
          onEmojiModalOpen={onEmojiModalOpen}
          onMorePress={onMorePress}
          onReactionPress={onReactionPress}
          onSharePress={onSharePress}
        />
      </Host>

      <PostReactionModal ref={reactionRef} />
      <ShareModal ref={shareRef} />
      <PostModalAction ref={postActionRef} />
      <PostEmojiPickerModal ref={postEmojiPickerRef} />
    </SafeAreaView>
  );
};
