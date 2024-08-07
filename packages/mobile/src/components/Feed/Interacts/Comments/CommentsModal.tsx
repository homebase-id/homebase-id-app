import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { Colors } from '../../../../app/Colors';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../ui/Text/Text';

import { ReactionContext } from '@youfoundation/js-lib/public';
import { CanReactInfo, useComments } from '../../../../hooks/reactions';
import { Comment } from './Comment';
import { SendChat } from '../../../ui/Icons/icons';
import { chatStyles } from '../../../Chat/ChatDetail';
import { t } from 'feed-app-common';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { TabStackParamList } from '../../../../app/App';

export interface CommentModalMethods {
  setContext: (context: ReactionContext & CanReactInfo) => void;
  dismiss: () => void;
}

export const CommentsModal = memo(
  forwardRef((_undefined, ref: React.Ref<CommentModalMethods>) => {
    const { isDarkMode } = useDarkMode();
    const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
    const [context, setContext] = useState<ReactionContext & CanReactInfo>();
    const navigation = useNavigation<NavigationProp<TabStackParamList>>();

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
          navigation.setOptions({
            tabBarVisible: false,
          });
        },
        dismiss: () => {
          setContext(undefined);
          bottomSheetRef.current?.dismiss();
          navigation.setOptions({
            tabBarVisible: true,
          });
        },
      };
    }, [navigation]);

    const onClose = () => {
      setContext(undefined);
    };
    const [message, setMessage] = useState('');

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => {
        return (
          <BottomSheetFooter {...props}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 7,
                paddingTop: 10,
                // height: 120,
                paddingBottom: Platform.select({
                  ios: 7,
                  android: 12,
                }),
              }}
            >
              <View
                style={{
                  borderRadius: 20,
                  borderWidth: 0,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  backgroundColor: isDarkMode ? Colors.slate[800] : Colors.indigo[50],
                  flex: 1,
                  alignItems: 'center',
                  flexDirection: 'row',
                }}
              >
                <BottomSheetTextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t('Add a comment...')}
                  style={{
                    flex: 1,
                    maxHeight: 80,
                    color: isDarkMode ? Colors.white : Colors.black,
                    paddingVertical: 8,
                  }}
                  autoFocus={false}
                  multiline
                  textAlignVertical="center" // Android only
                  autoCapitalize="sentences"
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  //
                }}
                style={chatStyles.send}
              >
                <View
                  style={{
                    transform: [
                      {
                        rotate: '50deg',
                      },
                    ],
                  }}
                >
                  <SendChat size={'md'} color={Colors.white} />
                </View>
              </TouchableOpacity>
            </View>
          </BottomSheetFooter>
        );
      },
      [isDarkMode, message]
    );

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['70%', '90%']}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        enableDismissOnClose={true}
        enablePanDownToClose
        // keyboardBehavior={'undefined'}
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
          textAlign: 'center',
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
    fontSize: 17,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: 'grey',
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