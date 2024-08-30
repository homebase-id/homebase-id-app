import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { View } from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { emojis } from 'rn-emoji-picker/dist/data';
import EmojiPicker from 'rn-emoji-picker';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Colors } from '../../../../app/Colors';

import { Emoji } from 'rn-emoji-picker/dist/interfaces';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { Backdrop } from '../../../ui/Modal/Backdrop';
import { ReactionContext } from '@homebase-id/js-lib/public';
import { useMyEmojiReactions, useReaction } from '../../../../hooks/reactions';
import { useDotYouClientContext } from 'feed-app-common';
import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';

export type PostEmojiPickerModalMethods = {
  setContext: (context: ReactionContext) => void;
  dismiss: () => void;
};

export const PostEmojiPickerModal = forwardRef(
  (_undefined, ref: React.Ref<PostEmojiPickerModalMethods>) => {
    const { isDarkMode } = useDarkMode();
    const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
    const [context, setContext] = useState<ReactionContext>();

    useImperativeHandle(ref, () => {
      return {
        setContext: (context: ReactionContext) => {
          setContext(context);
          bottomSheetRef.current?.present();
        },
        dismiss: () => {
          setContext(undefined);
          bottomSheetRef.current?.dismiss();
        },
      };
    });

    const {
      saveEmoji: { mutate: postEmoji, error: postEmojiError },
      removeEmoji: { mutate: removeEmoji, error: removeEmojiError },
    } = useReaction();
    const { data: myEmojis } = useMyEmojiReactions(context).fetch;
    const identity = useDotYouClientContext().getIdentity();

    const onSelectEmoji = useCallback((emoji: Emoji) => {
      if (!context) return;
      if (myEmojis && myEmojis?.length > 0 && myEmojis.includes(emoji.emoji)) {
        removeEmoji({
          emojiData: { body: emoji.emoji, authorOdinId: identity || '' },
          context,
        });
      } else {
        postEmoji({
          emojiData: { body: emoji.emoji, authorOdinId: identity || '' },
          context,
        });
      }
      onDismiss();
    }, []);

    const onDismiss = () => {
      setContext(undefined);
      bottomSheetRef.current?.dismiss();
    };

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['70%', '90%']}
        backdropComponent={Backdrop}
        onDismiss={onDismiss}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
      >
        <ErrorNotification error={postEmojiError || removeEmojiError} />
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
            onSelect={onSelectEmoji}
            backgroundColor={isDarkMode ? Colors.gray[900] : Colors.slate[50]}
          />
        </View>
      </BottomSheetModal>
    );
  }
);
