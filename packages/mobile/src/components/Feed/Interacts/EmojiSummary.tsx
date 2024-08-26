import { Pressable } from 'react-native';
import { Text } from '../../ui/Text/Text';
import { ReactionContext } from '@homebase-id/js-lib/public';
import { EmojiReactionSummary } from '@homebase-id/js-lib/core';
import { useEmojiSummary } from '../../../hooks/reactions';
import { memo } from 'react';

export const EmojiSummary = memo(
  ({
    context,
    reactionPreview,
    onReactionPress,
  }: {
    context: ReactionContext;
    onReactionPress?: () => void;
    reactionPreview?: EmojiReactionSummary;
  }) => {
    const { data: reactionSummary } = useEmojiSummary({
      context,
      reactionPreview: reactionPreview,
    }).fetch;

    if (reactionSummary && reactionSummary.totalCount > 0) {
      return (
        <Pressable
          onPress={onReactionPress}
          style={{
            flexDirection: 'row',
            gap: 4,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 15,
              opacity: 0.7,
              fontWeight: '500',
            }}
          >
            {reactionSummary.totalCount}
          </Text>
          <Text
            style={{
              fontSize: 15,
            }}
          >
            {reactionSummary.reactions.slice(0, 5).map((reaction) => reaction.emoji + ' ')}
          </Text>
        </Pressable>
      );
    }
  }
);
