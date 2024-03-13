import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { View } from 'react-native';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { emojis } from 'rn-emoji-picker/dist/data';
import EmojiPicker from 'rn-emoji-picker';
import React, { forwardRef } from 'react';
import { ChatMessageIMessage } from '../../../pages/chat-page';
import { useChatReaction } from '../../../hooks/chat/useChatReaction';
import { useConversation } from '../../../hooks/chat/useConversation';

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
      >
        <View
          style={{
            paddingHorizontal: 10,
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
            }} // callback when user selects emoji - returns emoji obj
            // backgroundColor={'#000'} // optional custom bg color
            // enabledCategories={[ // optional list of enabled category keys
            //   'recent',
            //   'emotion',
            //   'emojis',
            //   'activities',
            //   'flags',
            //   'food',
            //   'places',
            //   'nature'
            // ]}
            // defaultCategory={'food'} // optional default category key
          />
        </View>
      </BottomSheetModal>
    );
  }
);
