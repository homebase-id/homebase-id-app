import { ApiType, DotYouClient, HomebaseFile, NewHomebaseFile } from '@homebase-id/js-lib/core';
import { PostContent, ChannelDefinition, EmbeddedPost } from '@homebase-id/js-lib/public';
import { ChannelDefinitionVm } from '../../../hooks/feed/channels/useChannels';
import { t, useDotYouClientContext, useIsConnected } from 'feed-app-common';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../ui/Text/Text';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { openURL } from '../../../utils/utils';
import { Lock, Users } from '../../ui/Icons/icons';
import { aclEqual } from '@homebase-id/js-lib/helpers';
import { AclSummary } from '../Composer/AclSummary';
import { memo, useMemo } from 'react';

interface PostMetaWithPostFileProps {
  odinId?: string;
  authorOdinId?: string;
  postFile: HomebaseFile<PostContent>;
  embeddedPost?: undefined;
  channel?:
    | HomebaseFile<ChannelDefinitionVm | ChannelDefinition>
    | NewHomebaseFile<ChannelDefinitionVm | ChannelDefinition>;

  excludeContextMenu?: boolean;
}

interface PostMetaWithEmbeddedPostContentProps {
  odinId?: string;
  authorOdinId?: string;
  postFile?: HomebaseFile<PostContent>;
  embeddedPost: EmbeddedPost;
  channel?:
    | HomebaseFile<ChannelDefinitionVm | ChannelDefinition>
    | NewHomebaseFile<ChannelDefinitionVm | ChannelDefinition>;
  excludeContextMenu?: boolean;
}

export const PostMeta = memo(
  ({
    odinId,
    authorOdinId,
    postFile,
    embeddedPost,
    channel,
  }: PostMetaWithPostFileProps | PostMetaWithEmbeddedPostContentProps) => {
    const dotYouClient = useDotYouClientContext();
    const now = new Date();
    const date = new Date(postFile?.fileMetadata.appData.userDate || embeddedPost?.userDate || now);
    const yearsAgo = Math.abs(new Date(now.getTime() - date.getTime()).getUTCFullYear() - 1970);
    const format: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: yearsAgo !== 0 ? 'numeric' : undefined,
      hour: 'numeric',
      minute: 'numeric',
    };

    const identity = dotYouClient.getIdentity();
    const isAuthor = authorOdinId === identity;

    const isConnected = useIsConnected(odinId).data;

    const channelLink = useMemo(
      () =>
        channel
          ? `${odinId ? new DotYouClient({ identity: odinId, api: ApiType.Guest }).getRoot() : dotYouClient.getRoot()}/posts/${
              channel.fileMetadata.appData.content.slug
            }${isConnected && identity ? '?youauth-logon=' + identity : ''}`
          : undefined,
      [channel, dotYouClient, identity, isConnected, odinId]
    );

    const { isDarkMode } = useDarkMode();

    return (
      <View style={styles.postContainer}>
        <Text
          style={{
            opacity: 0.7,
            fontSize: 13,
            color: isDarkMode ? Colors.slate[50] : Colors.slate[900],
            fontWeight: '500',
          }}
        >
          {date.toLocaleDateString(undefined, format)} |{' '}
        </Text>
        {channel ? (
          <TouchableOpacity
            onPress={() => channelLink && openURL(channelLink)}
            style={styles.pressableContainer}
          >
            {postFile?.fileMetadata.isEncrypted && <Lock size={'xs'} color={Colors.indigo[500]} />}
            <Text style={styles.aclText}>
              {(isAuthor || !odinId) &&
              channel?.serverMetadata &&
              postFile?.serverMetadata &&
              !aclEqual(
                channel.serverMetadata.accessControlList,
                postFile.serverMetadata.accessControlList
              ) ? (
                <AclSummary acl={postFile.serverMetadata.accessControlList} />
              ) : (
                channel?.fileMetadata.appData.content.name || ''
              )}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
);

export const ToGroupBlock = memo(
  ({
    odinId,
    authorOdinId,
    channel,
  }: {
    odinId?: string;
    authorOdinId?: string;
    channel?:
      | HomebaseFile<ChannelDefinitionVm | ChannelDefinition>
      | NewHomebaseFile<ChannelDefinitionVm | ChannelDefinition>;
  }) => {
    const dotYouClient = useDotYouClientContext();
    const identity = dotYouClient.getIdentity();
    const groupPost =
      channel?.fileMetadata.appData.content.isCollaborative ||
      (authorOdinId !== (odinId || identity) && (odinId || identity) && authorOdinId);
    const isConnected = useIsConnected(odinId).data;

    const channelLink = useMemo(
      () =>
        channel
          ? `${odinId ? new DotYouClient({ identity: odinId, api: ApiType.Guest }).getRoot() : dotYouClient.getRoot()}/posts/${
              channel.fileMetadata.appData.content.slug
            }${isConnected && identity ? '?youauth-logon=' + identity : ''}`
          : undefined,
      [channel, dotYouClient, identity, isConnected, odinId]
    );
    if (!groupPost) return null;

    return (
      <View style={styles.groupContainer}>
        <Text style={styles.toText}>{t('to')} </Text>
        <TouchableOpacity
          onPress={() => channelLink && openURL(channelLink)}
          style={styles.pressableContainer}
        >
          <Text style={styles.channelText}>
            {channel?.fileMetadata.appData.content.name
              ? `${channel?.fileMetadata.appData.content.name}`
              : ''}
          </Text>
          <Users color={Colors.indigo[500]} size={'sm'} />
        </TouchableOpacity>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  postContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
  pressableContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  aclText: {
    color: Colors.indigo[500],
    fontWeight: '500',
    fontSize: 13,
  },
  channelText: {
    color: Colors.indigo[500],
    fontWeight: '500',
    textDecorationStyle: 'solid',
  },
  toText: {
    opacity: 0.6,
    fontSize: 14,
    fontWeight: '500',
  },
});
