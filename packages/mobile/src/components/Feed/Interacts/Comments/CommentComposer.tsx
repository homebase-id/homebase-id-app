import { ReactionContext } from '@youfoundation/js-lib/public';
import { CanReactInfo, useReaction } from '../../../../hooks/reactions';
import { t, useDotYouClientContext } from 'feed-app-common';
import { Platform, TouchableOpacity, View } from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { useCallback, useState } from 'react';
import { chatStyles } from '../../../Chat/ChatDetail';
import { SendChat } from '../../../ui/Icons/icons';
import { Colors } from '../../../../app/Colors';
import { OwnerAvatar } from '../../../ui/Avatars/Avatar';
import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';
import { CantReactInfo } from '../../CanReactInfo';

export const CommentComposer = ({
  context,
  replyThreadId,
  canReact,
}: {
  context: ReactionContext;
  replyThreadId?: string;
  canReact?: CanReactInfo;
}) => {
  const {
    mutateAsync: postComment,
    error: postCommentError,
    status: postState,
  } = useReaction().saveComment;

  const { isDarkMode } = useDarkMode();
  const [message, setMessage] = useState('');
  const identity = useDotYouClientContext().getIdentity();
  const disabled = postState === 'pending' || message.length === 0;

  const onPostComment = useCallback(async () => {
    if (postState === 'pending' || !message) return;

    try {
      await postComment({
        context: {
          ...context,
          target: {
            ...context.target,
            globalTransitId: replyThreadId || context.target.globalTransitId,
          },
        },
        commentData: {
          fileMetadata: {
            appData: {
              content: {
                authorOdinId: identity,
                body: message,
                //  attachment, //TODO: Add attachment option
              },
            },
          },
        },
      });
    } catch (e) {}
    setMessage('');
  }, [context, identity, message, postComment, postState, replyThreadId]);

  if (canReact?.canReact === true || canReact?.canReact === 'comment') {
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 7,
          paddingTop: 10,
          // height: 120,
          paddingBottom: Platform.select({
            ios: 7,
            android: 12,
          }),
        }}
      >
        <ErrorNotification error={postCommentError} />
        <OwnerAvatar
          imageSize={{
            width: 36,
            height: 36,
          }}
        />
        <View
          style={{
            borderRadius: 20,
            borderWidth: 0,
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: isDarkMode ? Colors.slate[800] : Colors.indigo[50],
            flex: 1,
            alignItems: 'center',
            flexDirection: 'row',
          }}
        >
          <BottomSheetTextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t('Add a comment...')}
            style={{
              flex: 1,
              maxHeight: 80,
              color: isDarkMode ? Colors.white : Colors.black,
              paddingVertical: 8,
            }}
            autoFocus={false}
            multiline
            textAlignVertical="center" // Android only
            autoCapitalize="sentences"
          />
        </View>
        <TouchableOpacity
          disabled={disabled}
          onPress={onPostComment}
          style={[
            chatStyles.send,
            {
              backgroundColor: disabled ? Colors.gray[300] : Colors.indigo[500],
            },
          ]}
        >
          <View
            style={{
              transform: [
                {
                  rotate: '50deg',
                },
              ],
            }}
          >
            <SendChat size={'md'} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }
  return <CantReactInfo cantReact={canReact} intent="comment" />;
};
