import { ApiType, DotYouClient, HomebaseFile, NewHomebaseFile } from '@youfoundation/js-lib/core';
import { PostContent, ChannelDefinition, EmbeddedPost } from '@youfoundation/js-lib/public';
import { ChannelDefinitionVm } from '../../../hooks/feed/channels/useChannels';
import { useDotYouClientContext, useIsConnected } from 'feed-app-common';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '../../ui/Text/Text';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { openURL } from '../../../utils/utils';
import { Lock } from '../../ui/Icons/icons';
import { aclEqual } from '@youfoundation/js-lib/helpers';
import { AclSummary } from '../Composer/AclSummary';

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

export const PostMeta = ({
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
  const channelLink = channel
    ? `${odinId ? new DotYouClient({ identity: odinId, api: ApiType.Guest }).getRoot() : dotYouClient.getRoot()}/posts/${
        channel.fileMetadata.appData.content.slug
      }${isConnected && identity ? '?youauth-logon=' + identity : ''}`
    : undefined;

  console.log(channelLink);

  const { isDarkMode } = useDarkMode();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginVertical: 4,
      }}
    >
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
          style={{
            flexDirection: 'row',
            gap: 4,
            alignItems: 'center',
          }}
        >
          {postFile?.fileMetadata.isEncrypted ? (
            <Lock size={'xs'} color={isDarkMode ? Colors.slate[500] : Colors.indigo[500]} />
          ) : null}
          <Text
            style={{
              color: isDarkMode ? Colors.slate[500] : Colors.indigo[500],
              fontWeight: '500',
              fontSize: 13,
            }}
          >
            {(isAuthor || !odinId) &&
            channel?.serverMetadata &&
            postFile?.serverMetadata &&
            !aclEqual(
              channel.serverMetadata.accessControlList,
              postFile.serverMetadata.accessControlList
            ) ? (
              <AclSummary acl={postFile.serverMetadata.accessControlList} />
            ) : (
              <>{channel?.fileMetadata.appData.content.name || ''}</>
            )}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};
