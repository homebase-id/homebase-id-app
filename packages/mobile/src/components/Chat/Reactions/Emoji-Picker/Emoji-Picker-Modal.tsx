import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { View } from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { emojis } from 'rn-emoji-picker/dist/data';
import EmojiPicker from 'rn-emoji-picker';
import React, { forwardRef, useCallback } from 'react';
import { useChatReaction } from '../../../../hooks/chat/useChatReaction';
import { useConversation } from '../../../../hooks/chat/useConversation';
import { Colors } from '../../../../app/Colors';
import { ChatMessageIMessage } from '../../ChatDetail';
import { Emoji } from 'rn-emoji-picker/dist/interfaces';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { Backdrop } from '../../../ui/Modal/Backdrop';

export const EmojiPickerModal = forwardRef(
  (
    {
      selectedMessage,
      onDismiss,
    }: {
      selectedMessage: ChatMessageIMessage | undefined;
      onDismiss: () => void;
    },
    ref: React.Ref<BottomSheetModalMethods>
  ) => {
    const { isDarkMode } = useDarkMode();

    const hasReactions =
      selectedMessage?.fileMetadata.reactionPreview?.reactions &&
      Object.keys(selectedMessage?.fileMetadata.reactionPreview?.reactions).length;
    const { mutate: addReaction } = useChatReaction({
      messageFileId: hasReactions ? selectedMessage?.fileId : undefined,
      messageGlobalTransitId: selectedMessage?.fileMetadata.globalTransitId,
    }).add;

    const conversation = useConversation({
      conversationId: selectedMessage?.fileMetadata.appData.groupId,
    }).single.data;

    const onSelectEmoji = useCallback(
      (emoji: Emoji) => {
        if (selectedMessage && ref && conversation) {
          addReaction({
            conversation: conversation,
            message: selectedMessage,
            reaction: emoji.emoji,
          });
          (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
          return;
        }
      },
      [addReaction, conversation, ref, selectedMessage]
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['70%', '90%']}
        backdropComponent={Backdrop}
        onDismiss={onDismiss}
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
        enableContentPanningGesture={false}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <EmojiPicker
            emojis={emojis} // emojis data source see data/emojis
            autoFocus={true} // autofocus search input
            loading={false} // spinner for if your emoji data or recent store is async
            darkMode={isDarkMode} // to be or not to be, that is the question
            perLine={7} // # of emoji's per line (reduced to avoid negative font size)
            onSelect={onSelectEmoji}
            backgroundColor={isDarkMode ? Colors.gray[900] : Colors.slate[50]}
          />
        </View>
      </BottomSheetModal>
    );
  }
);
