import { Pressable, View } from 'react-native';
import { Divider } from '../../ui/Divider';
import { t } from 'feed-app-common';
import { Text } from '../../ui/Text/Text';
import { CommentTeaser } from './Comments/Comment';
import { Colors } from '../../../app/Colors';
import { memo } from 'react';
import { CommentsReactionSummary } from '@homebase-id/js-lib/public';

export const CommentTeaserList = memo(
  ({
    reactionPreview,
    onExpand,
  }: {
    reactionPreview?: CommentsReactionSummary;
    onExpand?: () => void;
  }) => {
    if (!reactionPreview?.comments?.length) return null;
    const allEncrypted = reactionPreview.comments.every((comment) => comment.isEncrypted);
    return (
      <View
        style={{
          marginVertical: 6,
          marginHorizontal: 8,
        }}
      >
        <Divider
          style={{
            marginBottom: 8,
            opacity: 0.5,
          }}
        />
        <Pressable onPress={onExpand}>
          {reactionPreview.comments.slice(0, 3).map((comment, index) => (
            <CommentTeaser commentData={comment} key={index} />
          ))}
          {reactionPreview?.totalCount > 3 || allEncrypted ? (
            <Pressable onPress={onExpand}>
              <Text
                style={{
                  color: Colors.indigo[500],
                  fontWeight: '700',
                  opacity: 0.8,
                  fontSize: 14,
                  textDecorationLine: 'underline',
                }}
              >
                {`${!allEncrypted ? t('View') : t('Decrypt')} ${reactionPreview.totalCount} ${
                  reactionPreview.totalCount > 1 ? t('comments') : t('comment')
                }`}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </View>
    );
  }
);
