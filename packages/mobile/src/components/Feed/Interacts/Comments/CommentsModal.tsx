import {
  BottomSheetFlashList,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { Colors } from '../../../../app/Colors';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Text } from '../../../ui/Text/Text';

import { ReactionContext } from '@homebase-id/js-lib/public';
import { CanReactInfo, useComments } from '../../../../hooks/reactions';
import { Comment } from './Comment';

import { Backdrop } from '../../../ui/Modal/Backdrop';
import { CommentComposer } from './CommentComposer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomebaseFile, CommentReaction } from '@homebase-id/js-lib/core';
import { EmptyComment } from './EmptyComment';
import { useBottomSheetBackHandler } from '../../../../hooks/useBottomSheetBackHandler';
import { ListRenderItemInfo } from '@shopify/flash-list';

export interface CommentModalMethods {
  setContext: (context: ReactionContext & Partial<CanReactInfo>) => void;
  dismiss: () => void;
}

export const CommentsModal = memo(
  forwardRef((_undefined, ref: React.Ref<CommentModalMethods>) => {
    const { isDarkMode } = useDarkMode();
    const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
    const { handleSheetPositionChange } = useBottomSheetBackHandler(bottomSheetRef);
    const [context, setContext] = useState<ReactionContext & Partial<CanReactInfo>>();
    const [replyTo, setReplyThread] = useState<
      | {
          replyThreadId: string | undefined;
          authorOdinId: string;
        }
      | undefined
    >();

    const {
      data: comments,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
      isLoading,
      error,
    } = useComments({ context }).fetch;
    const flattenedComments = comments?.pages.flatMap((page) => page.comments).reverse();

    useImperativeHandle(ref, () => {
      return {
        setContext: (context: ReactionContext & Partial<CanReactInfo>) => {
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

    const { bottom } = useSafeAreaInsets();
    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => {
        return (
          <BottomSheetFooter
            {...props}
            bottomInset={bottom}
            style={{
              backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
            }}
          >
            <CommentComposer
              context={context as ReactionContext}
              canReact={context as CanReactInfo}
              replyThreadId={replyTo?.replyThreadId}
              replyOdinId={replyTo?.authorOdinId}
              onReplyCancel={() => setReplyThread(undefined)}
            />
          </BottomSheetFooter>
        );
      },
      [bottom, context, isDarkMode, replyTo]
    );

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<HomebaseFile<CommentReaction>>) => {
        return (
          <Comment
            commentData={item}
            context={context as ReactionContext}
            isThread={false}
            canReact={context as CanReactInfo}
            onReply={(commentFile) => {
              setReplyThread({
                replyThreadId: commentFile.fileMetadata.globalTransitId,
                authorOdinId: commentFile.fileMetadata.originalAuthor,
              });
            }}
          />
        );
      },
      [context]
    );
    const keyExtractor = useCallback((item: HomebaseFile<CommentReaction>) => item.fileId, []);
    const listFooter = useMemo(() => {
      if (isFetchingNextPage) return <CommentsLoader />;
      return <></>;
    }, [isFetchingNextPage]);

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['70%', '90%']}
        backdropComponent={Backdrop}
        onDismiss={onClose}
        enableDismissOnClose
        enablePanDownToClose
        keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
        keyboardBlurBehavior={'restore'}
        android_keyboardInputMode="adjustResize"
        onChange={handleSheetPositionChange}
        index={0}
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
        footerComponent={renderFooter}
      >
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
          }}
        >
          <Text style={styles.headerText}>Comments</Text>
        </View>

        {error ? (
          <ErrorLoadingComments />
        ) : isLoading ? (
          <CommentsLoader />
        ) : (
          <BottomSheetFlashList
            data={flattenedComments}
            keyExtractor={keyExtractor}
            estimatedItemSize={92}
            onEndReached={() => {
              if (hasNextPage) {
                fetchNextPage();
              }
            }}
            ListEmptyComponent={EmptyComment}
            onEndReachedThreshold={0.3}
            renderItem={renderItem}
            ListFooterComponent={listFooter}
            ListFooterComponentStyle={{ paddingBottom: bottom + 100 }}
          />
        )}
      </BottomSheetModal>
    );
  })
);

export const CommentsLoader = () => {
  const { isDarkMode } = useDarkMode();
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={isDarkMode ? Colors.indigo[400] : Colors.indigo[700]}
      />
    </View>
  );
};

export const ErrorLoadingComments = () => {
  return (
    <View style={styles.container}>
      <Text style={{ textAlign: 'center' }}>Error loading comments</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerText: {
    textAlign: 'center',
    margin: 6,
    fontSize: 17,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  footerContainer: {
    padding: 12,
    margin: 12,
    borderRadius: 12,
    backgroundColor: '#80f',
  },
  footerText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '800',
  },
});
