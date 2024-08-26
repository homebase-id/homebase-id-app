import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Backdrop } from '../../../ui/Modal/Backdrop';
import { Colors } from '../../../../app/Colors';
import { Text } from '../../../ui/Text/Text';
import { View } from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { ReactionContext } from '@homebase-id/js-lib/public';
import { useEmojiReactions } from '../../../../hooks/reactions';
import { ReactionFile } from '@homebase-id/js-lib/core';
import { ReactionTile } from '../../../Chat/Reactions/Modal/ReactionsModal';

export interface ReactionModalMethods {
  setContext: (context: ReactionContext) => void;
  dismiss: () => void;
}

const ReactionsModal = forwardRef((_undefined, ref: React.Ref<ReactionModalMethods>) => {
  const { isDarkMode } = useDarkMode();
  const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
  const [context, setContext] = useState<ReactionContext>();
  const { data: reactionDetails, hasNextPage, fetchNextPage } = useEmojiReactions(context).fetch;

  const flattenedReactions = reactionDetails?.pages
    .flatMap((page) => page?.reactions)
    .filter(Boolean) as ReactionFile[];

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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['50%', '90%']}
      backdropComponent={Backdrop}
      onDismiss={onClose}
      enableDismissOnClose={true}
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
        <BottomSheetFlatList
          data={flattenedReactions}
          renderItem={({ item }) => (
            <ReactionTile reaction={item.body} authorOdinId={item.authorOdinId} />
          )}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
        />
      </View>
    </BottomSheetModal>
  );
});

export { ReactionsModal as PostReactionModal };
