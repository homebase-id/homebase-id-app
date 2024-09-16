import { ReactionContext } from '@homebase-id/js-lib/public';
import { CanReactInfo, useReaction } from '../../../../hooks/reactions';
import { View } from 'react-native';
import TextButton from '../../../ui/Text/Text-Button';
import { EmojiSummary } from '../EmojiSummary';
import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';
import { formatToTimeAgo, t, useDotYouClientContext } from 'feed-app-common';
import { Text } from '../../../ui/Text/Text';
import { memo } from 'react';
import { Colors } from '../../../../app/Colors';

export const CommentMeta = memo(
  ({
    canReact,
    threadContext,
    created,
    updated,
    onReply,
  }: {
    canReact?: CanReactInfo;
    threadContext: ReactionContext;
    created?: number;
    updated?: number;
    onReply?: () => void;
  }) => {
    const isEdited = updated && updated !== 0 && updated !== created;
    const { mutateAsync: postReaction, error: postReactionError } = useReaction().saveEmoji;
    const identity = useDotYouClientContext().getIdentity();
    const doLike = () => {
      postReaction({
        emojiData: {
          authorOdinId: identity || '',
          body: '❤️',
        },
        context: threadContext,
      });
    };
    return (
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <ErrorNotification error={postReactionError} />
        {canReact?.canReact === true || canReact?.canReact === 'emoji' ? (
          <TextButton
            title="Like"
            textStyle={{
              fontSize: 14,
              fontWeight: '600',
              color: Colors.purple[500],
            }}
            onPress={doLike}
          />
        ) : null}
        <EmojiSummary context={threadContext} />
        {(canReact?.canReact === true || canReact?.canReact === 'comment') && onReply ? (
          <TextButton
            title="Reply"
            textStyle={{
              fontSize: 14,
              fontWeight: '600',
              color: Colors.purple[500],
            }}
            onPress={onReply}
          />
        ) : null}
        {created && (
          <Text
            style={{
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            {formatToTimeAgo(new Date(isEdited ? updated : created))}
            {isEdited ? <> - {t('Edited')}</> : null}
          </Text>
        )}
      </View>
    );
  }
);
