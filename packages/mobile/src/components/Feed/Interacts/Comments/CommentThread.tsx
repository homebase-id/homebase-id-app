import { ReactionContext } from '@homebase-id/js-lib/public';
import { CanReactInfo, useComments } from '../../../../hooks/reactions';
import { Comment } from './Comment';
import TextButton from '../../../ui/Text/Text-Button';
import { t } from 'feed-app-common';
import { memo, useMemo } from 'react';

export const CommentThread = memo(
  ({ context, canReact }: { context: ReactionContext; canReact?: CanReactInfo }) => {
    const {
      data: comments,
      hasNextPage,
      fetchNextPage,
    } = useComments({
      context,
    }).fetch;

    const flattenedComments = useMemo(
      () => comments?.pages.flatMap((page) => page.comments).reverse(),
      [comments]
    );

    return (
      <>
        {context.target.globalTransitId &&
          flattenedComments?.map((comment, index) => {
            return (
              <Comment
                context={context}
                commentData={comment}
                canReact={canReact}
                key={comment.fileId || index}
                isThread={true}
              />
            );
          })}
        {hasNextPage && (
          <TextButton
            title={t('View Older')}
            onPress={fetchNextPage}
            textStyle={{ fontSize: 16, fontWeight: '600' }}
            unFilledStyle={{ padding: 10 }}
          />
        )}
      </>
    );
  }
);
