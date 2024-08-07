import { Pressable } from 'react-native';
import { Text } from '../../ui/Text/Text';
import { ReactionContext } from '@youfoundation/js-lib/public';
import { EmojiReactionSummary } from '@youfoundation/js-lib/core';
import { useEmojiSummary } from '../../../hooks/reactions';
import { memo } from 'react';

export const EmojiSummary = memo(
  ({
    context,
    reactionPreview,
  }: {
    context: ReactionContext;

    reactionPreview?: EmojiReactionSummary;
  }) => {
    const { data: reactionSummary } = useEmojiSummary({
      context,
      reactionPreview: reactionPreview,
    }).fetch;

    //TODO: Open Reaction Summary Modal
    if (reactionSummary && reactionSummary.totalCount > 0) {
      return (
        <Pressable
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
