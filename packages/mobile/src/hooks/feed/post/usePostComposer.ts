import {
  AccessControlList,
  HomebaseFile,
  NewHomebaseFile,
  SecurityGroupType,
} from '@homebase-id/js-lib/core';
import {
  Tweet,
  Media,
  ChannelDefinition,
  BlogConfig,
  EmbeddedPost,
  ReactAccess,
} from '@homebase-id/js-lib/public';
import { getNewId, stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { useState } from 'react';
import { ImageSource } from '../../../provider/image/RNImageProvider';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { useManagePost } from './useManagePost';

type CollaborativeChannelDefinition = ChannelDefinition & { acl: AccessControlList };

export const usePostComposer = () => {
  const [processingProgress, setProcessingProgress] = useState<
    { phase: string; progress: number } | undefined
  >(undefined);
  const { mutateAsync: savePostFile } = useManagePost().save;
  const [postError, setPostError] = useState<unknown>();

  const savePost = async (
    caption: string | undefined,
    mediaFiles: ImageSource[] | undefined,
    linkPreviews: LinkPreview[] | undefined,
    embeddedPost: EmbeddedPost | undefined,
    channel: HomebaseFile<ChannelDefinition> | NewHomebaseFile<ChannelDefinition>,
    reactAccess: ReactAccess | undefined,
    overrideAcl: AccessControlList | undefined
  ) => {
    if (!mediaFiles && !caption && !embeddedPost) return;

    if (
      overrideAcl &&
      !stringGuidsEqual(channel.fileMetadata.appData.uniqueId, BlogConfig.PublicChannelId)
    ) {
      throw new Error('Custom ACLs are only allowed for public channels');
    }
    try {
      // Upload post
      const postId = getNewId();
      const postFile: NewHomebaseFile<Tweet | Media> = {
        fileMetadata: {
          appData: {
            userDate: new Date().getTime(),
            content: {
              type: mediaFiles && mediaFiles.length > 1 ? 'Media' : 'Tweet',
              caption: caption?.trim() || '',
              id: postId,
              slug: postId,
              channelId: channel.fileMetadata.appData.uniqueId || BlogConfig.PublicChannelId,
              reactAccess: reactAccess,

              embeddedPost: embeddedPost,
            },
          },
        },
        serverMetadata: overrideAcl
          ? {
              accessControlList: overrideAcl,
            }
          : channel.serverMetadata ||
            ((channel.fileMetadata.appData.content as CollaborativeChannelDefinition).acl
              ? {
                  accessControlList: (
                    channel.fileMetadata.appData.content as CollaborativeChannelDefinition
                  ).acl,
                }
              : undefined) || {
              accessControlList: { requiredSecurityGroup: SecurityGroupType.Owner },
            },
      };

      await savePostFile({
        postFile: postFile,
        channelId: channel.fileMetadata.appData.uniqueId as string,
        mediaFiles: mediaFiles,
        linkPreviews: linkPreviews,
        onUpdate: (phase, progress) => setProcessingProgress({ phase, progress }),
      });
    } catch (ex) {
      console.error('Failed to save post', ex);
      setPostError('error');
    }

    setProcessingProgress(undefined);
  };

  return {
    savePost,
    processingProgress,
    error: postError || undefined,
  };
};
