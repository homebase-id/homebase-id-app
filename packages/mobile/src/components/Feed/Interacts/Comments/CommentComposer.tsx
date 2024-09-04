import { ReactionContext } from '@homebase-id/js-lib/public';
import { CanReactInfo, useReaction } from '../../../../hooks/reactions';
import { t, useDotYouClientContext } from 'feed-app-common';
import { Platform, TouchableOpacity, View } from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { memo, useCallback, useState } from 'react';
import { chatStyles } from '../../../Chat/ChatDetail';
import { Close, Images, SendChat } from '../../../ui/Icons/icons';
import { Colors } from '../../../../app/Colors';
import { OwnerAvatar } from '../../../ui/Avatars/Avatar';
import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';
import { CantReactInfo } from '../../CanReactInfo';
import Animated, { Easing, SlideInUp } from 'react-native-reanimated';
import { Text } from '../../../ui/Text/Text';

import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { IconButton } from '../../../ui/Buttons';
import { FileOverview } from '../../../Files/FileOverview';

export const CommentComposer = memo(
  ({
    context,
    replyThreadId,
    canReact,
    onReplyCancel,
    replyOdinId,
  }: {
    context: ReactionContext;
    replyThreadId?: string;
    canReact?: CanReactInfo;
    onReplyCancel?: () => void;
    replyOdinId?: string;
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
    const [assets, setAssets] = useState<Asset[]>([]);

    const handleImageIconPress = useCallback(async () => {
      const medias = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeExtra: true,
      });
      if (medias.didCancel) return;
      // Keep assets without a type out of it.. We're never sure what it is...
      setAssets(medias.assets?.filter((asset) => asset.type) ?? []);
    }, [setAssets]);

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
      onReplyCancel?.();
    }, [context, identity, message, onReplyCancel, postComment, postState, replyThreadId]);

    if (canReact?.canReact === true || canReact?.canReact === 'comment') {
      return (
        <Animated.View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-end',
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
              alignItems: 'flex-start',
            }}
          >
            {replyThreadId && (
              <Animated.View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  marginTop: 2,
                  marginHorizontal: 2,
                }}
                entering={SlideInUp.withInitialValues({ originY: 10 })
                  .duration(150)
                  .easing(Easing.inOut(Easing.linear))}
              >
                <Text
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={{ color: isDarkMode ? Colors.gray[400] : Colors.gray[500], flex: 1 }}
                >
                  {t('Replying to')} {replyOdinId}
                </Text>
                <IconButton
                  icon={<Close />}
                  onPress={onReplyCancel}
                  style={{
                    padding: 0,
                  }}
                />
              </Animated.View>
            )}
            {assets && <FileOverview assets={assets} setAssets={setAssets} />}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <BottomSheetTextInput
                value={message}
                onChangeText={setMessage}
                placeholder={t('Add a comment...')}
                style={{
                  flex: 1,
                  maxHeight: 80,
                  paddingVertical: 8,
                  color: isDarkMode ? Colors.white : Colors.black,
                }}
                multiline
                textAlignVertical="center" // Android only
                autoCapitalize="sentences"
              />
              <IconButton icon={<Images />} onPress={handleImageIconPress} />
            </View>
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
        </Animated.View>
      );
    }
    return <CantReactInfo cantReact={canReact} intent="comment" />;
  }
);
