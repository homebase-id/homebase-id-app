import { ReactionContext } from '@youfoundation/js-lib/public';
import { CanReactInfo, useComments } from '../../../../hooks/reactions';
import { Comment } from './Comment';
import TextButton from '../../../ui/Text/Text-Button';
import { t } from 'feed-app-common';

export const CommentThread = ({
  context,
  canReact,
}: {
  context: ReactionContext;
  canReact?: CanReactInfo;
}) => {
  const {
    data: comments,
    hasNextPage,
    fetchNextPage,
  } = useComments({
    context,
  }).fetch;
  const flattenedComments = comments?.pages.flatMap((page) => page.comments).reverse();

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
        <TextButton title={t('View Older')} onPress={fetchNextPage} style={{ padding: 10 }} />
      )}
    </>
  );
};
