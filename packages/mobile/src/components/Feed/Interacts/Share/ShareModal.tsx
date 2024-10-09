import {
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetSectionList,
  BottomSheetTextInput,
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
  ListRenderItemInfo,
  Platform,
  SectionListData,
  SectionListRenderItemInfo,
  Share,
  StyleSheet,
  TextInput,
  TouchableHighlight,
  View,
} from 'react-native';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { Colors } from '../../../../app/Colors';
import {
  ChainLink,
  Facebook,
  LinkedIn,
  Reddit,
  SendChat,
  ShareUpArrow,
  WhatsApp,
  XTwitter,
} from '../../../ui/Icons/icons';
import { FlatList } from 'react-native-gesture-handler';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { openURL } from '../../../../utils/utils';
import { ContactTile } from '../../../Contact/Contact-Tile';
import { DotYouProfile } from '@homebase-id/js-lib/network';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import {
  ConversationWithYourself,
  UnifiedConversation,
} from '../../../../provider/chat/ConversationProvider';
import { GroupConversationsComponent, maxConnectionsForward } from '../../../Chat/Chat-Forward';
import { ChatStackParamList } from '../../../../app/ChatStack';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { t, useAllConnections } from 'homebase-id-app-common';
import { useConversation } from '../../../../hooks/chat/useConversation';
import { useChatMessage } from '../../../../hooks/chat/useChatMessage';
import {
  ConversationWithRecentMessage,
  useConversationsWithRecentMessage,
} from '../../../../hooks/chat/useConversationsWithRecentMessage';
import { getNewId } from '@homebase-id/js-lib/helpers';
import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';
import { AuthorName } from '../../../ui/Name';
import ConversationTile from '../../../Chat/Conversation-tile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConversationTileWithYourself } from '../../../Conversation/ConversationTileWithYourself';
import { IconButton } from '../../../ui/Buttons';
import { useBottomSheetBackHandler } from '../../../../hooks/useBottomSheetBackHandler';
import { SearchConversationWithSelectionResults } from '../../../Chat/SearchConversationsResults';

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
    const { data: connections } = useAllConnections(true);
    const { data: allConversations } = useConversationsWithRecentMessage().all;

    if (!connections || !allConversations) return null;

    return (
      <ShareModalListWrapper
        connections={connections}
        allConversations={allConversations}
        ref={ref}
      />
    );
  })
);

const ShareModalListWrapper = memo(
  forwardRef(
    (
      {
        connections,
        allConversations,
      }: {
        connections: DotYouProfile[] | undefined;
        allConversations: ConversationWithRecentMessage[] | undefined;
      },
      ref: React.Ref<ShareModalMethods>
    ) => {
      const bottomSheetRef = useRef<BottomSheetModalMethods>(null);

      const [context, setContext] = useState<ShareContext | undefined>();
      const [selectedContact, setselectedContact] = useState<DotYouProfile[]>([]);
      const [selectedConversation, setSelectedConversation] = useState<
        HomebaseFile<UnifiedConversation>[]
      >([]);
      const [query, setQuery] = useState<string | undefined>(undefined);
      const { handleSheetPositionChange } = useBottomSheetBackHandler(bottomSheetRef);

      const onClose = useCallback(() => {
        setContext(undefined);
        setselectedContact([]);
        setSelectedConversation([]);
        setQuery(undefined);
        bottomSheetRef.current?.dismiss();
      }, []);

      useImperativeHandle(ref, () => {
        return {
          setShareContext: (context: ShareContext) => {
            setContext(context);
            bottomSheetRef.current?.present();
          },
          dismiss: onClose,
        };
      }, [onClose]);

      const renderFooter = useCallback(
        (props: BottomSheetFooterProps) => {
          if (selectedConversation.length > 0 || selectedContact.length > 0) {
            return (
              <SelectedFooter
                selectedContact={selectedContact}
                selectedConversation={selectedConversation}
                onClose={onClose}
                context={context}
                {...props}
              />
            );
          }
          return <AppFooter context={context} {...props} />;
        },
        [context, onClose, selectedContact, selectedConversation]
      );

      const { isDarkMode } = useDarkMode();
      const isQueryActive = useMemo(() => !!(query && query.length >= 1), [query]);

      return (
        <BottomSheetModal
          ref={bottomSheetRef}
          onChange={handleSheetPositionChange}
          backdropComponent={Backdrop}
          onDismiss={onClose}
          enableDismissOnClose
          enablePanDownToClose
          snapPoints={['60%', '80%']}
          keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
          keyboardBlurBehavior={'restore'}
          android_keyboardInputMode="adjustResize"
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
          <BottomSheetTextInput
            placeholder="Search..."
            style={{
              backgroundColor: isDarkMode ? `${Colors.indigo[700]}3A` : `${Colors.indigo[300]}3C`,
              borderRadius: 20,
              paddingVertical: Platform.OS === 'ios' ? 16 : undefined,
              marginHorizontal: 12,
              marginVertical: 12,
              paddingLeft: 12,
              fontSize: 16,
              color: isDarkMode ? Colors.white : Colors.black,
            }}
            onChangeText={setQuery}
          />
          {/* They should be defined once they are loaded, but they can be empty */}

          {isQueryActive ? (
            <SearchConversationWithSelectionResults
              query={query}
              allConversations={allConversations || []}
              selectedContact={selectedContact}
              setSelectedContact={setselectedContact}
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
            />
          ) : !connections || !allConversations ? null : (
            <ShareModalList
              connections={connections}
              allConversations={allConversations}
              selectedContact={selectedContact}
              setSelectedContact={setselectedContact}
              selectedConversation={selectedConversation}
              setSelectedConversation={setSelectedConversation}
            />
          )}
        </BottomSheetModal>
      );
    }
  )
);

interface AppFooterProps extends BottomSheetFooterProps {
  context: ShareContext | undefined;
}
const AppFooter = memo(({ context, ...props }: AppFooterProps) => {
  const { isDarkMode } = useDarkMode();
  const { bottom } = useSafeAreaInsets();

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

  const renderButton = useCallback(
    ({
      item,
    }: ListRenderItemInfo<{
      title: string;
      icon: React.ReactNode;
      onPress: () => void;
    }>) => (
      <IconButton
        icon={item.icon}
        style={{
          backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
          borderRadius: 36,
        }}
        title={item.title}
        onPress={item.onPress}
      />
    ),
    [isDarkMode]
  );

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
        renderItem={renderButton}
      />
    </BottomSheetFooter>
  );
});

interface SelectedFooterProps extends BottomSheetFooterProps {
  context: ShareContext | undefined;
  selectedContact: DotYouProfile[];
  selectedConversation: HomebaseFile<UnifiedConversation>[];
  onClose: () => void;
}
const SelectedFooter = memo(
  ({ context, selectedContact, selectedConversation, onClose, ...props }: SelectedFooterProps) => {
    const { isDarkMode } = useDarkMode();
    const { bottom } = useSafeAreaInsets();

    const { mutateAsync: createConversation } = useConversation().create;
    const { mutate: sendMessage, error } = useChatMessage().send;
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

    const onShare = useCallback(async () => {
      if (selectedContact.length === 0 && selectedConversation.length === 0) {
        return;
      }

      async function forwardMessages(conversation: HomebaseFile<UnifiedConversation>) {
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
      context,
      createConversation,
      navigation,
      onClose,
      selectedContact,
      selectedConversation,
      sendMessage,
    ]);

    return (
      <>
        <ErrorNotification error={error} />
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
      </>
    );
  }
);

const ShareModalList = memo(
  ({
    connections,
    allConversations,
    selectedContact,
    setSelectedContact,
    selectedConversation,
    setSelectedConversation,
  }: {
    connections: DotYouProfile[] | undefined;
    allConversations: ConversationWithRecentMessage[] | undefined;
    selectedContact: DotYouProfile[];
    setSelectedContact: React.Dispatch<React.SetStateAction<DotYouProfile[]>>;
    selectedConversation: HomebaseFile<UnifiedConversation>[];
    setSelectedConversation: React.Dispatch<
      React.SetStateAction<HomebaseFile<UnifiedConversation>[]>
    >;
  }) => {
    const onSelectConversation = useCallback(
      (conversation: HomebaseFile<UnifiedConversation>) => {
        setSelectedConversation((selectedConversation) => {
          if (selectedConversation.includes(conversation)) {
            return selectedConversation.filter((c) => c !== conversation);
          } else {
            if (selectedContact.length + selectedConversation.length === maxConnectionsForward) {
              Toast.show({
                type: 'info',
                text1: t('Max Forward Limit Reached'),
                text2: t('You can only forward to {0} contacts at a time', maxConnectionsForward),
                position: 'bottom',
                visibilityTime: 2000,
              });

              return selectedConversation;
            }
            return [...selectedConversation, conversation];
          }
        });
      },
      [setSelectedConversation, selectedContact]
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
                text1: t('Max Forward Limit Reached'),
                text2: t('You can only forward to {0} contacts at a time', maxConnectionsForward),
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
        section: { title, data },
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
        if (data?.length === 0) {
          return null;
        }
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
          <GroupConversationsComponent
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
