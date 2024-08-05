import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { Colors } from '../../../../app/Colors';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../ui/Text/Text';

import { ReactionContext } from '@youfoundation/js-lib/public';
import { CanReactInfo, useComments } from '../../../../hooks/reactions';
import { Comment } from './Comment';

export interface CommentModalMethods {
  setContext: (context: ReactionContext & CanReactInfo) => void;
  dismiss: () => void;
}

export const CommentsModal = memo(
  forwardRef((_undefined, ref: React.Ref<CommentModalMethods>) => {
    const { isDarkMode } = useDarkMode();
    const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
    const [context, setContext] = useState<ReactionContext & CanReactInfo>();
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} opacity={0.5} appearsOnIndex={0} disappearsOnIndex={-1} />
      ),
      []
    );

    const { data: comments, hasNextPage, fetchNextPage } = useComments({ context }).fetch;
    const flattenedComments = comments?.pages.flatMap((page) => page.comments).reverse();

    useImperativeHandle(ref, () => {
      return {
        setContext: (context: ReactionContext & CanReactInfo) => {
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
        snapPoints={['75%']}
        backdropComponent={renderBackdrop}
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
        <Text style={styles.headerText}>Comments</Text>
        <BottomSheetFlatList
          data={flattenedComments}
          contentContainerStyle={{ flexGrow: 1 }}
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          ListEmptyComponent={EmptyComponent}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <Comment
              commentData={item}
              context={context as ReactionContext}
              isThread={false}
              canReact={context}
            />
          )}
        />
      </BottomSheetModal>
    );
  })
);

const EmptyComponent = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          marginBottom: 16,
        }}
      >
        No Comments yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '400',
          color: Colors.gray[500],
        }}
      >
        Be the first to comment on this post.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerText: {
    textAlign: 'center',
    margin: 6,
    fontSize: 16,
    fontWeight: '500',
  },
});
