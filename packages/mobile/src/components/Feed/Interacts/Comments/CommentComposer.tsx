import { ReactionContext } from '@homebase-id/js-lib/public';
import { CanReactInfo, useReaction } from '../../../../hooks/reactions';
import { t, useDotYouClientContext } from 'feed-app-common';
import { ActivityIndicator, Platform, TouchableOpacity, View } from 'react-native';
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
import TextButton from '../../../ui/Text/Text-Button';

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
    const [comment, setComment] = useState('');
    const identity = useDotYouClientContext().getIdentity();
    const [assets, setAssets] = useState<Asset[]>([]);
    const disabled = postState === 'pending' || (comment.length === 0 && assets.length === 0);

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
      if (postState === 'pending' || (!comment && !assets)) return;

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
                  body: comment,
                  attachment: assets.map((value) => {
                    return {
                      height: value.height || 0,
                      width: value.width || 0,
                      name: value.fileName,
                      type: value.type && value.type === 'image/jpg' ? 'image/jpeg' : value.type,
                      uri: value.uri,
                      filename: value.fileName,
                      date: Date.parse(value.timestamp || new Date().toUTCString()),
                      filepath: value.originalPath,
                      id: value.id,
                      fileSize: value.fileSize,
                    };
                  })?.[0],
                },
              },
            },
          },
        });
      } catch (e) {}
      setComment('');
      onReplyCancel?.();
    }, [assets, context, identity, comment, onReplyCancel, postComment, postState, replyThreadId]);

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
          <Animated.View
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
                value={comment}
                onChangeText={setComment}
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
          </Animated.View>
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

export const CommentEditor = memo(
  ({
    defaultBody = '',
    defaultAttachment,
    doPost,
    onCancel,
    postState,
  }: {
    defaultBody?: string;
    defaultAttachment?: Asset;
    doPost: (commentBody: string, attachment?: Asset) => void;
    onCancel?: () => void;
    postState: 'pending' | 'loading' | 'success' | 'error' | 'idle';
  }) => {
    const [body, setBody] = useState(defaultBody);
    const [attachment, setAttachment] = useState<Asset | undefined>(defaultAttachment);
    const hasContent = body?.length || attachment;

    const handleImageIconPress = useCallback(async () => {
      const medias = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeExtra: true,
      });
      if (medias.didCancel) return;
      // Keep assets without a type out of it.. We're never sure what it is...
      const media: Asset[] = medias.assets?.filter((asset) => asset.type) ?? [];
      setAttachment(media[0]);
    }, [setAttachment]);

    const { isDarkMode } = useDarkMode();

    return (
      <Animated.View
        style={{
          borderRadius: 20,
          borderWidth: 0,
          paddingHorizontal: 10,
          paddingVertical: 5,
          backgroundColor: isDarkMode ? Colors.slate[800] : Colors.indigo[50],
          alignItems: 'flex-start',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <BottomSheetTextInput
            value={body}
            onChangeText={setBody}
            autoFocus
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
          {onCancel && <TextButton title="Cancel" onPress={onCancel} />}
          <TouchableOpacity disabled={!hasContent} onPress={() => doPost(body, attachment)}>
            {postState === 'loading' ? (
              <ActivityIndicator size={'small'} color={Colors.indigo[500]} />
            ) : (
              <View
                style={{
                  transform: [
                    {
                      rotate: '50deg',
                    },
                  ],
                }}
              >
                <SendChat
                  size={'md'}
                  color={
                    !hasContent ? (isDarkMode ? Colors.gray[700] : Colors.gray[200]) : undefined
                  }
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
        <FileOverview
          assets={attachment ? [attachment] : []}
          setAssets={(newFiles) => setAttachment(newFiles?.[0])}
        />
        <IconButton icon={<Images />} onPress={handleImageIconPress} />
      </Animated.View>
    );
  }
);
