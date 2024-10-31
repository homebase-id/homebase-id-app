import { useQuery } from '@tanstack/react-query';
import { getMyReactions, ReactionContext } from '@homebase-id/js-lib/public';
import { useDotYouClientContext } from 'homebase-id-app-common';

const PAGE_SIZE = 10;

export const useMyEmojiReactions = (context?: ReactionContext) => {
  const dotYouClient = useDotYouClientContext();

  const fetch = async ({
    context,
    pageParam,
  }: {
    context?: ReactionContext;
    pageParam?: string;
  }) => {
    if (
      !context?.odinId ||
      !context?.channelId ||
      (!context?.target?.fileId && !context?.target?.globalTransitId)
    ) {
      return [];
    }
    return (
      (await getMyReactions(
        dotYouClient,
        dotYouClient.getIdentity() || undefined,
        context,
        PAGE_SIZE,
        pageParam
      )) || []
    );
  };

  return {
    fetch: useQuery({
      queryKey: [
        'my-emojis',
        context?.odinId,
        context?.channelId,
        context?.target?.fileId,
        context?.target?.globalTransitId,
      ],
      queryFn: () => fetch({ context }),

      refetchOnMount: false,
      refetchOnWindowFocus: false,

      enabled:
        !!context?.odinId &&
        !!context?.channelId &&
        (!!context?.target?.fileId || !!context?.target?.globalTransitId),
    }),
  };
};
