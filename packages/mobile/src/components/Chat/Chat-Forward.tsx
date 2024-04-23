import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  TouchableHighlight,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useState } from 'react';
import { Text } from '../ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useAllConnections } from 'feed-app-common';
import { ListRenderItemInfo, StyleSheet, View } from 'react-native';
import { DotYouProfile } from '@youfoundation/js-lib/network';
import { ContactTile } from '../Contact/Contact-Tile';
import { SendChat } from '../ui/Icons/icons';
import { AuthorName } from '../ui/Name';
import Toast from 'react-native-toast-message';
import { useConversation } from '../../hooks/chat/useConversation';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { ChatMessageIMessage } from './ChatDetail';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../../app/App';
import { ErrorNotification } from '../ui/Alert/ErrorNotification';

export type ChatForwardModalProps = {
  onClose: () => void;
  selectedMessage: ChatMessageIMessage | undefined;
};

export const ChatForwardModal = forwardRef(
  (props: ChatForwardModalProps, ref: React.Ref<BottomSheetModalMethods>) => {
    const { onClose, selectedMessage: message } = props;
    const { isDarkMode } = useDarkMode();
    const { data: connections } = useAllConnections(true);
    const { mutateAsync: fetchConversation } = useConversation().create;
    const { mutate: sendMessage, error } = useChatMessage().send;
    const [selectedContact, setselectedContact] = useState<DotYouProfile[]>([]);
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

    /// Limit to forward maximum number of contacts
    const maxContactForward = 3;
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} opacity={0.5} appearsOnIndex={0} disappearsOnIndex={-1} />
      ),
      []
    );

    const onForward = useCallback(async () => {
      if (selectedContact.length === 0 || !message) return;
      const promises = selectedContact.flatMap(async (contact) => {
        const { newConversationId: conversationId } = await fetchConversation({
          recipients: [contact.odinId],
        });
        //TODO: Need to cover cases for payloads and group conversations
        sendMessage({
          conversationId,
          recipients: [contact.odinId],
          message: message.fileMetadata.appData.content.message,
        });
      });

      await Promise.all(promises);
      if (promises.length === 1) {
        const contact = selectedContact[0];
        const { newConversationId: conversationId } = await fetchConversation({
          recipients: [contact.odinId],
        });
        navigation.navigate('ChatScreen', {
          convoId: conversationId,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Message sent successfully',
          position: 'bottom',
        });
      }
      onClose();
    }, [fetchConversation, message, navigation, onClose, selectedContact, sendMessage]);

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<DotYouProfile>) => (
        <ContactTile
          item={item}
          onPress={() => {
            if (selectedContact.includes(item)) {
              setselectedContact(selectedContact.filter((contact) => contact !== item));
            } else {
              if (selectedContact.length === maxContactForward) {
                Toast.show({
                  type: 'error',
                  text1: `You can only forward to ${maxContactForward} contacts at a time`,
                  position: 'bottom',
                  visibilityTime: 2000,
                });

                return;
              }
              setselectedContact([...selectedContact, item]);
            }
          }}
          isSelected={selectedContact.includes(item)}
          selectMode
        />
      ),
      [selectedContact]
    );

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter
          {...props}
          style={{
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <View style={styles.namesContainer}>
            {selectedContact.map((contact) => {
              return (
                <Text
                  key={contact.odinId}
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    borderRadius: 15,
                    backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
                    padding: 10,
                    overflow: 'hidden',
                  }}
                >
                  <AuthorName odinId={contact.odinId} showYou />
                </Text>
              );
            })}
          </View>
          <TouchableHighlight
            underlayColor={Colors.slate[800]}
            onPress={onForward}
            style={styles.footerContainer}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <Text style={styles.footerText}>Send</Text>
              <View
                style={{
                  transform: [{ rotate: '50deg' }],
                }}
              >
                <SendChat color={Colors.white} />
              </View>
            </View>
          </TouchableHighlight>
        </BottomSheetFooter>
      ),
      [isDarkMode, onForward, selectedContact]
    );

    const onDismiss = useCallback(() => {
      if (selectedContact.length > 0) {
        setselectedContact([]);
      }
      onClose();
    }, [onClose, selectedContact.length]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['69%', '99%']}
        onDismiss={onDismiss}
        enableDismissOnClose={true}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        index={0}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
        footerComponent={selectedContact.length > 0 ? renderFooter : undefined}
      >
        <ErrorNotification error={error} />
        <Text style={styles.headerText}>Forward To</Text>
        <BottomSheetFlatList
          data={connections}
          keyExtractor={(item) => item.odinId}
          renderItem={renderItem}
        />
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  footerContainer: {
    padding: 12,
    margin: 12,
    alignSelf: 'flex-end',
    borderRadius: 12,
    backgroundColor: '#80f',
  },
  namesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginLeft: 12,
    overflow: 'hidden',
    flexWrap: 'wrap',
  },
  footerText: {
    textAlign: 'center',
    color: Colors.white,
    fontWeight: '700',
  },
  headerText: {
    textAlign: 'center',
    margin: 6,
    fontSize: 16,
    fontWeight: '500',
  },
});
