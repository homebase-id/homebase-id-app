import { BottomSheetFlatList, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ListRenderItemInfo, ScrollView, Text, View } from 'react-native';
import { Colors } from '../../../../app/Colors';
import { useDarkMode } from '../../../../hooks/useDarkMode';

import { ChatMessageIMessage } from '../../ChatDetail';
import { useChatReaction } from '../../../../hooks/chat/useChatReaction';
import { Avatar, OwnerAvatar } from '../../../ui/Avatars/Avatar';
import { AuthorName } from '../../../ui/Name';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { Backdrop } from '../../../ui/Modal/Backdrop';
import { openURL } from '../../../../utils/utils';
import TextButton from '../../../ui/Text/Text-Button';
import { EmojiReaction } from '@homebase-id/js-lib/core';
import { t } from 'homebase-id-app-common';

export const ReactionsModal = memo(
  forwardRef(
    (
      { message, onClose }: { message: ChatMessageIMessage | undefined; onClose: () => void },
      ref: React.Ref<BottomSheetModalMethods>
    ) => {
      const { isDarkMode } = useDarkMode();
      const { data: reactions, isLoading } = useChatReaction({
        messageFileId: message?.fileId,
        messageGlobalTransitId: message?.fileMetadata.globalTransitId,
      }).get;
      const [activeEmoji, setActiveEmoji] = useState<string>('all');

      const filteredEmojis = useMemo(() => {
        const pureEmojis = reactions?.map((reaction) => reaction.body.trim());
        return Array.from(new Set(pureEmojis));
      }, [reactions]);

      const renderHeader = useCallback(() => {
        if (!filteredEmojis) return null;
        return (
          <ScrollView
            horizontal
            style={{
              flexDirection: 'row',
              gap: 10,
            }}
          >
            {filteredEmojis.length > 1 ? (
              <TextButton
                unFilledStyle={{
                  backgroundColor:
                    activeEmoji === 'all'
                      ? isDarkMode
                        ? Colors.violet[900]
                        : Colors.violet[200]
                      : undefined,
                  borderRadius: 8,
                  padding: 8,
                }}
                key={'all'}
                title={`${t('All')} ${reactions?.length}`}
                onPress={() => setActiveEmoji('all')}
              />
            ) : null}
            {filteredEmojis.map((reaction) => {
              const count = reactions?.filter((emoji) => emoji.body === reaction).length;
              return (
                <TextButton
                  unFilledStyle={{
                    backgroundColor:
                      activeEmoji === reaction || filteredEmojis?.length === 1
                        ? isDarkMode
                          ? Colors.violet[900]
                          : Colors.violet[200]
                        : undefined,
                    borderRadius: 8,
                    padding: 8,
                  }}
                  key={reaction}
                  title={`${reaction} ${count}`}
                  onPress={() => setActiveEmoji(reaction)}
                />
              );
            })}
          </ScrollView>
        );
      }, [activeEmoji, filteredEmojis, isDarkMode, reactions]);

      const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<EmojiReaction>) => (
          <ReactionTile key={item.authorOdinId + item.body} reaction={item.body} {...item} />
        ),
        []
      );

      return (
        <BottomSheetModal
          ref={ref}
          snapPoints={['50%']}
          backdropComponent={Backdrop}
          onDismiss={onClose}
          enableDismissOnClose={true}
          enablePanDownToClose
          enableDynamicSizing={false}
          index={0}
          backgroundStyle={{
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          }}
          handleIndicatorStyle={{
            backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
          }}
        >
          <BottomSheetView
            style={{
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: isDarkMode ? Colors.white : Colors.slate[700],
                marginBottom: 10,
              }}
            >
              Reactions
            </Text>
            {isLoading ? (
              <ActivityIndicator
                size={'large'}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              />
            ) : (
              <>
                {renderHeader()}
                <BottomSheetFlatList
                  data={reactions?.filter(
                    (reaction) => reaction.body === activeEmoji || activeEmoji === 'all'
                  )}
                  keyExtractor={(item) => item.authorOdinId + item.body}
                  renderItem={renderItem}
                />
              </>
            )}
          </BottomSheetView>
        </BottomSheetModal>
      );
    }
  )
);

export const ReactionTile = ({
  reaction,
  authorOdinId,
}: {
  reaction: string;
  authorOdinId?: string;
}) => {
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
      }}
    >
      {authorOdinId ? (
        <Avatar
          odinId={authorOdinId}
          imageSize={{ width: 42, height: 42 }}
          style={{
            marginRight: 16,
            width: 42,
            height: 42,
          }}
          onPress={() => openURL(`https://${authorOdinId}/`)}
        />
      ) : (
        <OwnerAvatar
          imageSize={{ width: 42, height: 42 }}
          style={{
            marginRight: 16,
            width: 42,
            height: 42,
          }}
        />
      )}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '500',
            color: isDarkMode ? Colors.white : Colors.slate[700],
          }}
        >
          <AuthorName odinId={authorOdinId} showYou />
        </Text>
        <Text
          style={{
            fontSize: 24,
            color: isDarkMode ? Colors.white : Colors.slate[700],
          }}
        >
          {reaction}
        </Text>
      </View>
    </View>
  );
};
