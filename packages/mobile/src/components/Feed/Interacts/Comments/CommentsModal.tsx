import {
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetView,
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
import { ActivityIndicator, ListRenderItemInfo, Platform, StyleSheet, View } from 'react-native';
import { Text } from '../../../ui/Text/Text';

import { ReactionContext } from '@homebase-id/js-lib/public';
import { CanReactInfo, useComments } from '../../../../hooks/reactions';
import { Comment } from './Comment';

import { Backdrop } from '../../../ui/Modal/Backdrop';
import { CommentComposer } from './CommentComposer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomebaseFile, ReactionFile } from '@homebase-id/js-lib/core';
import { t } from 'feed-app-common';

export interface CommentModalMethods {
  setContext: (context: ReactionContext & CanReactInfo) => void;
  dismiss: () => void;
}

export const CommentsModal = memo(
  forwardRef((_undefined, ref: React.Ref<CommentModalMethods>) => {
    const { isDarkMode } = useDarkMode();
    const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
    const [context, setContext] = useState<ReactionContext & CanReactInfo>();
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
    } = useComments({ context }).fetch;
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
    console.log('comments', context);
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
              canReact={context}
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
      ({ item }: ListRenderItemInfo<HomebaseFile<ReactionFile>>) => {
        return (
          <Comment
            commentData={item}
            context={context as ReactionContext}
            isThread={false}
            canReact={context}
            onReply={(commentFile) => {
              setReplyThread({
                replyThreadId: commentFile.fileMetadata.globalTransitId,
                authorOdinId: commentFile.fileMetadata.appData.content.authorOdinId,
              });
            }}
          />
        );
      },
      [context]
    );

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
        index={0}
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

        {isLoading ? (
          <CommentsLoader />
        ) : (
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
            renderItem={renderItem}
            ListFooterComponent={listFooter}
            ListFooterComponentStyle={{ paddingBottom: bottom + 100 }}
          />
        )}
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
          textAlign: 'center',
        }}
      >
        {t('No Comments yet')}
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

const CommentsLoader = () => {
  const { isDarkMode } = useDarkMode();
  return (
    <BottomSheetView style={styles.container}>
      <ActivityIndicator
        size="large"
        color={isDarkMode ? Colors.indigo[400] : Colors.indigo[700]}
      />
    </BottomSheetView>
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
