import {
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetSectionList,
} from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Backdrop } from '../../../ui/Modal/Backdrop';
import { Text } from '../../../ui/Text/Text';
import {
  Linking,
  Platform,
  SectionListData,
  SectionListRenderItemInfo,
  Share,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { Colors } from '../../../../app/Colors';
import { IconButton } from '../../../Chat/Chat-app-bar';
import {
  ChainLink,
  Facebook,
  LinkedIn,
  Reddit,
  SendChat,
  ShareUpArrow,
  SignalMessenger,
  WhatsApp,
  XTwitter,
} from '../../../ui/Icons/icons';
import { FlatList } from 'react-native-gesture-handler';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { openURL } from '../../../../utils/utils';
import { ContactTile } from '../../../Contact/Contact-Tile';
import { DotYouProfile } from '@youfoundation/js-lib/network';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import {
  ConversationWithYourself,
  UnifiedConversation,
} from '../../../../provider/chat/ConversationProvider';
import { ListHeaderComponent, maxConnectionsForward } from '../../../Chat/Chat-Forward';
import { ChatStackParamList } from '../../../../app/ChatStack';
import { Link, NavigationProp, useNavigation } from '@react-navigation/native';
import { t, useAllConnections } from 'feed-app-common';
import { useConversation } from '../../../../hooks/chat/useConversation';
import { useChatMessage } from '../../../../hooks/chat/useChatMessage';
import {
  ConversationWithRecentMessage,
  useConversationsWithRecentMessage,
} from '../../../../hooks/chat/useConversationsWithRecentMessage';
import { getNewId } from '@youfoundation/js-lib/helpers';
import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';
import { AuthorName } from '../../../ui/Name';
import { ConversationTileWithYourself } from '../../../../pages/conversations-page';
import ConversationTile from '../../../Chat/Conversation-tile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ShareModalMethods = {
  setShareContext: (context: ShareContext) => void;
  dismiss: () => void;
};

export interface ShareContext {
  href: string;
  title?: string;
}

export const ShareModal = memo(
  forwardRef((_undefined, ref: React.Ref<ShareModalMethods>) => {
    const [context, setContext] = useState<ShareContext | undefined>();
    const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
    const { mutateAsync: createConversation } = useConversation().create;
    const { mutate: sendMessage, error } = useChatMessage().send;

    const { data: connections } = useAllConnections(true);
    const { data: allConversations } = useConversationsWithRecentMessage().all;
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

    const [selectedContact, setselectedContact] = useState<DotYouProfile[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<
      HomebaseFile<UnifiedConversation>[]
    >([]);

    useImperativeHandle(ref, () => {
      return {
        setShareContext: (context: ShareContext) => {
          setContext(context);
          bottomSheetRef.current?.present();
        },
        dismiss: onClose,
      };
    }, []);

    const onShare = useCallback(async () => {
      if (selectedContact.length === 0 && selectedConversation.length === 0) {
        return;
      }

      async function forwardMessages(conversation: HomebaseFile<UnifiedConversation>) {
        //TODO: Handle a case where if a conversation doesn't exist and a command needs to be sent
        return sendMessage({
          conversation,
          message: `${context?.title || ''}${context?.href}`,
          chatId: getNewId(),
          userDate: new Date().getTime(),
        });
      }
      const promises: Promise<void>[] = [];
      if (selectedContact.length > 0) {
        promises.push(
          ...selectedContact.flatMap(async (contact) => {
            const conversation = await createConversation({
              recipients: [contact.odinId],
            });

            return forwardMessages(conversation);
          })
        );
      }

      if (selectedConversation.length > 0) {
        promises.push(
          ...selectedConversation.flatMap((conversation) => {
            return forwardMessages(conversation);
          })
        );
      }

      await Promise.all(promises);
      if (promises.length === 1) {
        if (selectedContact.length === 1) {
          const contact = selectedContact[0];

          // TODO: needs to change to fetch instead of still trying to create
          const conversation = await createConversation({
            recipients: [contact.odinId],
          });
          navigation.navigate('ChatScreen', {
            convoId: conversation.fileMetadata.appData.uniqueId as string,
          });
        }
        if (selectedConversation.length === 1) {
          const group = selectedConversation[0];
          navigation.navigate('ChatScreen', {
            convoId: group.fileMetadata.appData.uniqueId as string,
          });
        }
      } else {
        Toast.show({
          type: 'success',
          text1: 'Message sent successfully',
          position: 'bottom',
        });
      }
      onClose();
    }, [
      context?.href,
      context?.title,
      createConversation,
      navigation,
      selectedContact,
      selectedConversation,
      sendMessage,
    ]);

    const socialOptions = useMemo(
      () => [
        {
          title: 'Share To...',
          icon: <ShareUpArrow size={'xl'} />,
          onPress: () => {
            Share.share({
              url: context?.href || '',
              title: context?.title,
              message: Platform.OS === 'android' ? context?.href : 'Shared from Homebase',
            });
          },
        },
        {
          title: 'Copy Link',
          icon: <ChainLink size={'xl'} />,
          onPress: () => {
            Clipboard.setString(context?.href || '');
            Toast.show({
              text1: 'Copied to Clipboard',
              type: 'success',
              visibilityTime: 2000,
              position: 'top',
            });
          },
        },
        {
          title: 'Whatsapp',
          icon: <WhatsApp size={'xl'} />,
          onPress: () => {
            Linking.openURL(`whatsapp://send?text=${context?.title || ''}${context?.href}`);
          },
        },
        //NOTE: Signal does not support url scheme atm.
        // {
        //   title: 'Signal',
        //   icon: <SignalMessenger size={'xl'} />,
        //   onPress: () => {
        //     Linking.openURL(`sgnl://send?text=${context?.title || ''}${context?.href}`);
        //   },
        // },
        {
          title: 'Facebook',
          icon: <Facebook size={'xl'} />,
          onPress: () => {
            openURL(`https://www.facebook.com/sharer/sharer.php?u=${context?.href}`);
          },
        },
        {
          title: 'X',
          icon: <XTwitter size={'xl'} />,
          onPress: () => {
            openURL(`https://x.com/intent/tweet?url=${context?.href}&text=${context?.title}`);
          },
        },
        {
          title: 'Linkedin',
          icon: <LinkedIn size={'xl'} />,
          onPress: () => {
            openURL(`https://www.linkedin.com/shareArticle?mini=true&url=${context?.href}`);
          },
        },
        {
          title: 'Reddit',
          icon: <Reddit size={'xl'} />,
          onPress: () => {
            openURL(`https://www.reddit.com/submit?url=${context?.href}&title=${context?.title}`);
          },
        },
      ],
      [context]
    );

    const onClose = () => {
      setContext(undefined);
      setselectedContact([]);
      setSelectedConversation([]);
      bottomSheetRef.current?.dismiss();
    };

    const { isDarkMode } = useDarkMode();
    const { bottom } = useSafeAreaInsets();

    const renderAppFooter = useCallback(
      (props: BottomSheetFooterProps) => {
        return (
          <BottomSheetFooter
            {...props}
            style={{
              backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
            }}
          >
            <FlatList
              showsHorizontalScrollIndicator={false}
              data={socialOptions}
              horizontal
              contentContainerStyle={{
                gap: 24,
              }}
              style={{
                padding: 10,
                paddingTop: 16,
                flexDirection: 'row',
                borderTopColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                borderTopWidth: 2,
                paddingBottom: bottom,
              }}
              keyExtractor={(item) => item.title}
              renderItem={({ item }) => (
                <IconButton
                  icon={item.icon}
                  style={{
                    backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                    borderRadius: 36,
                  }}
                  title={item.title}
                  onPress={item.onPress}
                />
              )}
            />
          </BottomSheetFooter>
        );
      },
      [bottom, isDarkMode, socialOptions]
    );

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => {
        if (selectedConversation.length > 0 || selectedContact.length > 0) {
          return (
            <BottomSheetFooter
              {...props}
              style={{
                backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: bottom,
              }}
            >
              <View style={[styles.namesContainer]}>
                {selectedConversation.map((group) => {
                  return (
                    <Text
                      key={group.fileId}
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        borderRadius: 15,
                        backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
                        padding: 10,
                        overflow: 'hidden',
                      }}
                    >
                      {group.fileMetadata.appData.content.title}
                    </Text>
                  );
                })}
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
                onPress={onShare}
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
          );
        }
        return renderAppFooter(props);
      },
      [bottom, isDarkMode, onShare, renderAppFooter, selectedContact, selectedConversation]
    );

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        backdropComponent={Backdrop}
        onDismiss={onClose}
        enableDismissOnClose
        enablePanDownToClose
        snapPoints={['60%', '80%']}
        footerComponent={renderFooter}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
      >
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
          }}
        >
          <Text style={styles.headerText}>Share</Text>
        </View>
        <ErrorNotification error={error} />

        <InnerShareListComponent
          connections={connections}
          allConversations={allConversations}
          selectedContact={selectedContact}
          setSelectedContact={setselectedContact}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
        />
      </BottomSheetModal>
    );
  })
);

const InnerShareListComponent = memo(
  (props: {
    connections: DotYouProfile[] | undefined;
    allConversations: ConversationWithRecentMessage[] | undefined;

    selectedContact: DotYouProfile[];
    setSelectedContact: React.Dispatch<React.SetStateAction<DotYouProfile[]>>;

    selectedConversation: HomebaseFile<UnifiedConversation>[];
    setSelectedConversation: React.Dispatch<
      React.SetStateAction<HomebaseFile<UnifiedConversation>[]>
    >;
  }) => {
    const {
      connections,
      allConversations,
      selectedContact,
      setSelectedContact,
      selectedConversation,
      setSelectedConversation,
    } = props;

    const onSelectConversation = useCallback(
      (conversation: HomebaseFile<UnifiedConversation>) => {
        setSelectedConversation((selectedConversation) => {
          if (selectedConversation.includes(conversation)) {
            return selectedConversation.filter((c) => c !== conversation);
          } else {
            if (selectedContact.length + selectedConversation.length === maxConnectionsForward) {
              Toast.show({
                type: 'info',
                text1: t('You can only forward to {0} contacts at a time', maxConnectionsForward),
                position: 'bottom',
                visibilityTime: 2000,
              });

              return selectedConversation;
            }
            return [...selectedConversation, conversation];
          }
        });
      },
      [setSelectedConversation, selectedContact.length]
    );

    const onSelectContact = useCallback(
      (contact: DotYouProfile) => {
        setSelectedContact((selectedContact) => {
          if (selectedContact.includes(contact)) {
            return selectedContact.filter((c) => c !== contact);
          } else {
            if (selectedContact.length + selectedConversation.length === maxConnectionsForward) {
              Toast.show({
                type: 'info',
                text1: t('You can only forward to {0} contacts at a time', maxConnectionsForward),
                position: 'bottom',
                visibilityTime: 2000,
              });

              return selectedContact;
            }
            return [...selectedContact, contact];
          }
        });
      },
      [setSelectedContact, selectedConversation.length]
    );

    const sectionData = useMemo((): ReadonlyArray<
      SectionListData<
        ConversationWithRecentMessage | DotYouProfile,
        | {
            id: string;
            title: string;
            data: ConversationWithRecentMessage[] | undefined;
          }
        | {
            id: string;
            title: string;
            data: DotYouProfile[] | undefined;
          }
        | undefined
      >
    > => {
      return [
        {
          id: 'recent',
          title: t('Recents'),
          data: allConversations?.slice(0, 5) || [], // Show top 5 recent conversations
          keyExtractor: (item) => (item as ConversationWithRecentMessage).fileId,
        },
        {
          id: 'contacts',
          title: t('Contacts'),
          data: connections || [],
          keyExtractor: (item) => (item as DotYouProfile).odinId,
        },
      ];
    }, [connections, allConversations]);

    const renderSectionHeader = useCallback(
      ({
        section: { title },
      }: {
        section: SectionListData<
          ConversationWithRecentMessage | DotYouProfile,
          | {
              id: string;
              title: string;
              data: ConversationWithRecentMessage[] | undefined;
            }
          | {
              id: string;
              title: string;
              data: DotYouProfile[] | undefined;
            }
          | undefined
        >;
      }) => {
        return (
          <Text
            style={{
              ...styles.headerText,
              textAlign: 'left',
              fontSize: 18,
              marginLeft: 16,
              marginTop: 16,
            }}
          >
            {title}
          </Text>
        );
      },
      []
    );

    const renderItem = useCallback(
      ({
        item,
        section,
      }: SectionListRenderItemInfo<
        ConversationWithRecentMessage | DotYouProfile,
        | {
            id: string;
            title: string;
            data: ConversationWithRecentMessage[] | undefined;
          }
        | {
            id: string;
            title: string;
            data: DotYouProfile[] | undefined;
          }
        | undefined
      >) => {
        if (section.id === 'recent') {
          if (section.data.length === 0) {
            return null;
          }
          const conversation = item as unknown as ConversationWithRecentMessage;
          return (
            <ConversationTile
              conversation={conversation.fileMetadata.appData.content}
              conversationId={conversation.fileMetadata.appData.uniqueId}
              selectMode
              isSelected={selectedConversation.includes(conversation)}
              onPress={() => onSelectConversation(conversation)}
              odinId={conversation.fileMetadata.appData.content.recipients[0]}
              style={{ padding: 0, paddingHorizontal: 16, paddingVertical: 10 }}
            />
          );
        }

        if (section.id === 'contacts') {
          const contact = item as unknown as DotYouProfile;
          return (
            <ContactTile
              item={contact}
              onPress={() => onSelectContact(contact)}
              isSelected={selectedContact.includes(contact)}
              selectMode
            />
          );
        }
        return null;
      },
      [onSelectContact, onSelectConversation, selectedContact, selectedConversation]
    );

    // No need to render yet, the data is still loading and is offline available
    if (!connections || !allConversations) {
      return null;
    }

    return (
      <BottomSheetSectionList
        sections={sectionData}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <ConversationTileWithYourself
            selecMode
            isSelected={selectedConversation.includes(ConversationWithYourself)}
            onPress={() => onSelectConversation(ConversationWithYourself)}
          />
        }
        ListFooterComponent={
          //Actually a Group Component
          <ListHeaderComponent
            selectedGroup={selectedConversation}
            setselectedGroup={setSelectedConversation}
          />
        }
        ListFooterComponentStyle={{
          paddingBottom: 100,
        }}
      />
    );
  }
);

const styles = StyleSheet.create({
  headerText: {
    textAlign: 'center',
    margin: 6,
    fontSize: 17,
    fontWeight: '600',
  },
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
  content: {
    borderRadius: 8,
    alignSelf: 'center',
    flex: 1,
  },
});
