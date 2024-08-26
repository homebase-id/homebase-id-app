import { useQuery } from '@tanstack/react-query';
import { getReactionSummary, ReactionContext } from '@homebase-id/js-lib/public';
import { EmojiReactionSummary } from '@homebase-id/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';

export const useEmojiSummary = ({
  context,
  reactionPreview,
}: {
  context: ReactionContext;
  reactionPreview?: EmojiReactionSummary;
}) => {
  const dotYouClient = useDotYouClientContext();

  const fetch = async (context: ReactionContext): Promise<EmojiReactionSummary> => {
    if (
      !context.authorOdinId ||
      !context.channelId ||
      (!context.target.globalTransitId && !context.target.fileId)
    ) {
      return { reactions: [], totalCount: 0 };
    }

    return await getReactionSummary(dotYouClient, context);
  };

  return {
    fetch: useQuery({
      queryKey: [
        'emojis-summary',
        context.authorOdinId,
        context.channelId,
        context.target.fileId,
        context.target.globalTransitId,
      ],
      queryFn: () => fetch(context),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds => Just for the initial render
      gcTime: Infinity,
      initialData: reactionPreview,
      // By default, initialData is treated as totally fresh, as if it were just fetched. This also means that it will affect how it is interpreted by the staleTime option.
      enabled:
        !!context.authorOdinId &&
        !!context.channelId &&
        (!!context.target.globalTransitId || !!context.target.fileId),
    }),
  };
};
