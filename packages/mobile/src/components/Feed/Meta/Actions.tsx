import { TouchableOpacity } from 'react-native';
import { Text } from '../../ui/Text/Text';
import { memo, ReactNode } from 'react';
import { ChannelDefinition, PostContent } from '@homebase-id/js-lib/public';
import { ApiType, DotYouClient, HomebaseFile, NewHomebaseFile } from '@homebase-id/js-lib/core';
import { t, useDotYouClientContext } from 'feed-app-common';
import { useManageSocialFeed } from '../../../hooks/feed/useManageSocialFeed';
import { ChannelDefinitionVm } from '../../../hooks/feed/channels/useChannels';
import { useManagePost } from '../../../hooks/feed/post/useManagePost';
import { openURL } from '../../../utils/utils';
import { ErrorNotification } from '../../ui/Alert/ErrorNotification';
import { Users, Times, Flag, Block, ChainLink, Trash } from '../../ui/Icons/icons';

export type ActionGroupProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  confirmOptions?: {
    title: string;
    body: string;
    buttonText: string;
  };
  destructive?: boolean;
};

export const ExternalActions = memo(
  ({
    odinId,
    postFile,
    onClose,
  }: {
    odinId: string;
    postFile: HomebaseFile<PostContent>;
    onClose?: () => void;
  }) => {
    const identity = useDotYouClientContext().getIdentity();
    const {
      removeFromFeed: { mutateAsync: removeFromMyFeed },
      getReportContentUrl,
    } = useManageSocialFeed({ odinId });

    const host = new DotYouClient({
      api: ApiType.Guest,
      identity: identity || undefined,
    }).getRoot();
    const options: ActionGroupProps[] = [
      {
        icon: <Users />,
        label: `${t('Follow settings')}`,
        onPress: () => {
          openURL(`${host}/owner/connections/${odinId}/follow-settings`);
          onClose?.();
        },
      },
      {
        icon: <Times />,
        label: `${t('Remove this post from my feed')}`,
        onPress: () => {
          removeFromMyFeed({ postFile });
          onClose?.();
        },
      },
      {
        icon: <Flag />,
        label: `${t('Report')}`,
        onPress: async () => {
          const reportUrl = await getReportContentUrl();
          openURL(reportUrl);
          onClose?.();
        },
      },
      {
        icon: <Block />,
        label: `${t('Block this user')}`,
        onPress: () => {
          openURL(`${host}/owner/connections/${odinId}/block`);
          onClose?.();
        },
      },
    ];
    return (
      <>
        {options.map((option, index) => {
          if (!option) return null;
          return <ActionButton key={index} {...option} />;
        })}
      </>
    );
  }
);

export const GroupChannelActions = memo(
  ({
    odinId,
    channelLink,
    channel,
    postFile,
    onClose,
  }: {
    odinId?: string;
    channelLink?: string;
    channel?:
      | HomebaseFile<ChannelDefinitionVm | ChannelDefinition>
      | NewHomebaseFile<ChannelDefinitionVm | ChannelDefinition>;
    postFile: HomebaseFile<PostContent>;
    onClose?: () => void;
  }) => {
    const identity = useDotYouClientContext().getIdentity();
    const isAuthor = postFile.fileMetadata.appData.content.authorOdinId === identity;

    const {
      removeFromFeed: { mutateAsync: removeFromMyFeed },
      getReportContentUrl,
    } = useManageSocialFeed(odinId ? { odinId } : undefined);

    const { mutateAsync: removePost, error: removePostError } = useManagePost().remove;

    const options: (ActionGroupProps | undefined)[] = [];
    if (channelLink) {
      options.push({
        icon: <ChainLink />,
        label: `${t('Go to collaborative channel')}`,
        onPress: () => {
          openURL(channelLink);
          onClose?.();
        },
      });
    }
    options.push({
      icon: <Times />,
      label: `${t('Remove this post from my feed')}`,
      onPress: () => {
        removeFromMyFeed({ postFile });
        onClose?.();
      },
    });
    if (!isAuthor) {
      options.push({
        icon: <Flag />,
        label: `${t('Report')}`,
        onPress: async () => {
          const reportUrl = await getReportContentUrl();
          openURL(reportUrl);
          onClose?.();
        },
      });
    }

    // If the channel has serverMetadata, it is a collaborative channel from this identity so we can remove the post
    if (channel && channel.serverMetadata) {
      options.push({
        icon: <Trash />,
        destructive: true,
        label: t(
          postFile.fileMetadata.appData.content.type === 'Article'
            ? 'Remove Article'
            : 'Remove post'
        ),
        confirmOptions: {
          title: `${t('Remove')} "${
            postFile.fileMetadata.appData.content.caption.substring(0, 50) || t('Untitled')
          }"`,
          buttonText: 'Permanently remove',
          body: t('Are you sure you want to remove this post? This action cannot be undone.'),
        },
        onPress: async () => {
          await removePost({
            channelId: postFile.fileMetadata.appData.content.channelId,
            postFile,
          });
          onClose?.();
        },
      });
    }
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

export const ActionButton = memo(
  ({ icon, label, onPress, destructive, confirmOptions }: ActionGroupProps) => {
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
        }}
        onPress={onPress}
      >
        {icon}
        <Text
          style={{
            marginLeft: 16,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
);
