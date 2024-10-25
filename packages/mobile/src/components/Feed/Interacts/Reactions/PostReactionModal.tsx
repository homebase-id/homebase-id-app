import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Backdrop } from '../../../ui/Modal/Backdrop';
import { Colors } from '../../../../app/Colors';
import { Text } from '../../../ui/Text/Text';
import { View } from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { ReactionContext } from '@homebase-id/js-lib/public';
import { useEmojiReactions, useEmojiSummary } from '../../../../hooks/reactions';
import { ReactionFile } from '@homebase-id/js-lib/core';
import { ReactionTile } from '../../../Chat/Reactions/Modal/ReactionsModal';
import { useBottomSheetBackHandler } from '../../../../hooks/useBottomSheetBackHandler';
import TextButton from '../../../ui/Text/Text-Button';

export interface ReactionModalMethods {
  setContext: (context: ReactionContext) => void;
  dismiss: () => void;
}

const ReactionsModal = memo(
  forwardRef((_undefined, ref: React.Ref<ReactionModalMethods>) => {
    const { isDarkMode } = useDarkMode();
    const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
    const [context, setContext] = useState<ReactionContext>();
    const {
      data: reactionDetails,
      hasNextPage,
      fetchNextPage,
      isFetchedAfterMount: reactionsDetailsLoaded,
    } = useEmojiReactions(context).fetch;
    const { data: reactionSummary, isFetchedAfterMount: reactionSummaryLoaded } = useEmojiSummary({
      context,
    }).fetch;
    const [activeEmoji, setActiveEmoji] = useState<string>();

    const { handleSheetPositionChange } = useBottomSheetBackHandler(bottomSheetRef);

    const flattenedReactions = reactionDetails?.pages
      .flatMap((page) => page?.reactions)
      .filter(Boolean) as ReactionFile[];

    const filteredEmojis = reactionSummary?.reactions?.filter((reaction) =>
      flattenedReactions?.some((reactionFile) => reactionFile.body === reaction.emoji)
    );

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
    }, []);

    const onClose = () => {
      setContext(undefined);
    };

    useEffect(() => {
      if (filteredEmojis?.length && !activeEmoji) {
        setActiveEmoji(filteredEmojis?.[0].emoji);
      }
    }, [activeEmoji, filteredEmojis, reactionSummaryLoaded, reactionsDetailsLoaded]);

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        onChange={handleSheetPositionChange}
        snapPoints={['50%', '90%']}
        backdropComponent={Backdrop}
        onDismiss={onClose}
        enableDismissOnClose={true}
        enableDynamicSizing={false}
        enablePanDownToClose
        index={0}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
      >
        <View
          style={{
            paddingHorizontal: 10,
            flex: 1,
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
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginBottom: 10,
            }}
          >
            {filteredEmojis?.map((reaction, index) => {
              return (
                <TextButton
                  unFilledStyle={{
                    backgroundColor:
                      activeEmoji === reaction.emoji
                        ? isDarkMode
                          ? Colors.violet[900]
                          : Colors.violet[200]
                        : undefined,
                    borderRadius: 8,
                    padding: 8,
                  }}
                  key={index}
                  title={`${reaction.emoji} ${reaction.count}`}
                  onPress={() => setActiveEmoji(reaction.emoji)}
                />
              );
            })}
          </View>
          <BottomSheetFlatList
            data={flattenedReactions?.filter((reaction) => reaction.body === activeEmoji)}
            renderItem={({ item }) => (
              <ReactionTile reaction={item.body} authorOdinId={item.authorOdinId} />
            )}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.3}
          />
        </View>
      </BottomSheetModal>
    );
  })
);

export { ReactionsModal as PostReactionModal };
