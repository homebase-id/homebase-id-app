import {
  AccessControlList,
  HomebaseFile,
  NewHomebaseFile,
  SecurityGroupType,
  NewMediaFile,
} from '@youfoundation/js-lib/core';
import {
  Tweet,
  Media,
  ChannelDefinition,
  BlogConfig,
  EmbeddedPost,
  ReactAccess,
} from '@youfoundation/js-lib/public';
import { getNewId, stringGuidsEqual } from '@youfoundation/js-lib/helpers';
import { useState } from 'react';
import { usePost } from './usePost';
import { useDotYouClientContext } from 'feed-app-common';
import { ImageSource } from '../../../provider/image/RNImageProvider';

type CollaborativeChannelDefinition = ChannelDefinition & { acl: AccessControlList };

export const usePostComposer = () => {
  const [postState, setPostState] = useState<'uploading' | 'encrypting' | 'error' | undefined>();
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const dotYouClient = useDotYouClientContext();
  const loggedInIdentity = dotYouClient.getIdentity();
  const { mutateAsync: savePostFile, error: savePostError } = usePost().save;

  const savePost = async (
    caption: string | undefined,
    mediaFiles: ImageSource[] | undefined,
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
      setPostState('uploading');

      // Upload post
      const postId = getNewId();
      const postFile: NewHomebaseFile<Tweet | Media> = {
        fileMetadata: {
          appData: {
            userDate: new Date().getTime(),
            content: {
              authorOdinId: loggedInIdentity || dotYouClient.getIdentity(),
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
        onUpdate: (progress) => setProcessingProgress(progress),
      });
    } catch (ex) {
      setPostState('error');
    }

    setPostState(undefined);
    setProcessingProgress(0);
  };

  return {
    savePost,
    postState,
    processingProgress,
    error: postState === 'error' ? savePostError : undefined,
  };
};
