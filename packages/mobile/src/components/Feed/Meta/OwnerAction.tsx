import { memo, useState } from 'react';
import { useManagePost } from '../../../hooks/feed/post/useManagePost';
import { useChannel } from '../../../hooks/feed/channels/useChannel';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import { PostContent } from '@homebase-id/js-lib/public';
import { ActionButton, ActionGroupProps } from '../Interacts/PostActionModal';
import { Copy, Pencil, Trash } from '../../ui/Icons/icons';
import { t, useDotYouClientContext } from 'feed-app-common';
import { openURL } from '../../../utils/utils';
import { ErrorNotification } from '../../ui/Alert/ErrorNotification';

export const OwnerActions = memo(
  ({ postFile, onClose }: { postFile: HomebaseFile<PostContent>; onClose?: () => void }) => {
    const postContent = postFile.fileMetadata.appData.content;

    const [isEditOpen, setIsEditOpen] = useState(false); // TODO: Setup edit post modal
    const { mutateAsync: removePost, error: removePostError } = useManagePost().remove;
    const { data: channel } = useChannel({ channelKey: postContent.channelId }).fetch;
    const host = useDotYouClientContext().getEndpoint();
    const options: (ActionGroupProps | undefined)[] = postFile.fileId
      ? [
          {
            icon: <Pencil />,
            label: t(postContent.type === 'Article' ? 'Edit Article' : 'Edit post'),
            onPress: () => {
              if (postContent.type === 'Article') {
                const targetUrl = `${host}/apps/feed/edit/${
                  channel?.fileMetadata.appData.content.slug ||
                  channel?.fileMetadata.appData.uniqueId
                }/${postContent.id}`;
                openURL(targetUrl);
              } else {
                setIsEditOpen(true);
              }
              onClose?.();
            },
          },
          postContent.type === 'Article'
            ? {
                icon: <Copy />,
                label: t('Duplicate Article'),
                onPress: () => {
                  openURL(
                    `${host}/apps/feed/duplicate/${channel?.fileMetadata.appData.content.slug || channel?.fileMetadata.appData.uniqueId}/${postContent.id}`
                  );
                  onClose?.();
                },
              }
            : undefined,
          {
            icon: <Trash />,
            label: t(postContent.type === 'Article' ? 'Remove Article' : 'Remove post'),
            confirmOptions: {
              title: `${t('Remove')} "${postContent.caption.substring(0, 50) || t('Untitled')}"`,
              buttonText: 'Permanently remove',
              body: t('Are you sure you want to remove this post? This action cannot be undone.'),
            },
            onPress: async () => {
              await removePost({
                channelId: postContent.channelId,
                postFile,
              });

              onClose?.();
            },
          },
        ]
      : [];

    return (
      <>
        <ErrorNotification error={removePostError} />
        {options.map((option, index) => {
          if (!option) return null;
          return <ActionButton key={index} {...option} />;
        })}
      </>
    );
  }
);
