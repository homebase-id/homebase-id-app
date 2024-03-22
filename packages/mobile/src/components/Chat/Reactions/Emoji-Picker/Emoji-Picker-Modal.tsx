import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { View } from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { emojis } from 'rn-emoji-picker/dist/data';
import EmojiPicker from 'rn-emoji-picker';
import React, { forwardRef } from 'react';
import { useChatReaction } from '../../../../hooks/chat/useChatReaction';
import { useConversation } from '../../../../hooks/chat/useConversation';
import { Colors } from '../../../../app/Colors';
import { ChatMessageIMessage } from '../../ChatDetail';

export const EmojiPickerModal = forwardRef(
  (
    {
      selectedMessage,
    }: {
      selectedMessage: ChatMessageIMessage | undefined;
    },
    ref
  ) => {
    const { isDarkMode } = useDarkMode();

    const { mutate: addReaction } = useChatReaction({
      conversationId: selectedMessage?.fileMetadata.appData.groupId,
      messageId: selectedMessage?.fileMetadata.appData.uniqueId,
    }).add;
    const conversation = useConversation({
      conversationId: selectedMessage?.fileMetadata.appData.groupId,
    }).single.data;
    return (
      <BottomSheetModal
        ref={ref as any}
        snapPoints={['50%', '90%']}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.white,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
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
            perLine={7} // # of emoji's per line
            onSelect={(emoji) => {
              if (selectedMessage && ref && conversation) {
                addReaction({
                  conversation: conversation,
                  message: selectedMessage,
                  reaction: emoji.emoji,
                });
                (ref as React.RefObject<BottomSheetModal>).current?.dismiss();
                return;
              }
            }}
          />
        </View>
      </BottomSheetModal>
    );
  }
);
