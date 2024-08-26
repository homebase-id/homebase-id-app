import { t, useDotYouClientContext } from 'feed-app-common';
import { Block, Ellipsis, Pencil, Times } from '../../../ui/Icons/icons';
import { ApiType, DotYouClient } from '@homebase-id/js-lib/core';
import { View } from 'react-native';
import { Text } from '../../../ui/Text/Text';
import { AuthorName } from '../../../ui/Name';
import { ActionGroup } from '../../../ui/Form/ActionGroup';
import { openURL } from '../../../../utils/utils';

export const CommentHead = ({
  authorOdinId,
  setIsEdit,
  onRemove,
}: {
  authorOdinId: string;
  setIsEdit?: (isEdit: boolean) => void;
  onRemove?: () => void;
}) => {
  const identity = useDotYouClientContext().getIdentity();
  const isAuthor = authorOdinId === identity;

  const actionOptions = [];

  if (identity && isAuthor && setIsEdit && onRemove) {
    actionOptions.push({ label: t('Edit'), onPress: () => setIsEdit(true), icon: Pencil });
    actionOptions.push({ label: t('Remove'), onPress: onRemove, icon: Times });
  }

  // idenity && to make sure the user is logged in
  if (identity && !isAuthor) {
    actionOptions.push({
      icon: Block,
      label: `${t('Block this user')}`,
      onPress: () =>
        openURL(
          `${new DotYouClient({ identity, api: ApiType.Guest }).getRoot()}/owner/connections/${authorOdinId}/block`
        ),
    });
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: '500',
          opacity: 0.7,
          marginBottom: 4,
        }}
      >
        <AuthorName odinId={authorOdinId} />
      </Text>
      <ActionGroup options={actionOptions}>
        <Ellipsis size={'sm'} />
      </ActionGroup>
    </View>
  );
};
