import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { View } from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { emojis } from 'rn-emoji-picker/dist/data';
import EmojiPicker from 'rn-emoji-picker';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';
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

    const [recent, setRecent] = useState<Emoji[]>([]);
    // Load recent emojis from AsyncStorage on mount
    useEffect(() => {
      AsyncStorage.getItem('recentEmojis').then((data) => {
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) setRecent(parsed);
          } catch {}
        }
      });
    }, []);
    // Save recent emojis to AsyncStorage whenever updated
    useEffect(() => {
      AsyncStorage.setItem('recentEmojis', JSON.stringify(recent));
    }, [recent]);

    const onSelectEmoji = useCallback(
      (emoji: Emoji) => {
        // Add to recent if not present
        setRecent((prev) => {
          if (prev.find((e) => e.unified === emoji.unified)) return prev;
          return [emoji, ...prev].slice(0, 18);
        });
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
            emojis={emojis}
            recent={recent}
            onChangeRecent={setRecent}
            autoFocus={true}
            loading={false}
            darkMode={isDarkMode}
            perLine={7}
            onSelect={onSelectEmoji}
            backgroundColor={isDarkMode ? Colors.gray[900] : Colors.slate[50]}
          />
        </View>
      </BottomSheetModal>
    );
  }
);
