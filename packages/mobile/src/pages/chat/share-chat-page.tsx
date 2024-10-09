import {
  ActivityIndicator,
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import { ChatStackParamList } from '../../app/ChatStack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDarkMode } from '../../hooks/useDarkMode';
import { t, useAllConnections } from 'homebase-id-app-common';
import { useConversation } from '../../hooks/chat/useConversation';
import { memo, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { DotYouProfile } from '@homebase-id/js-lib/network';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import {
  ConversationWithYourself,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { NavigationProp, StackActions, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ContactTile } from '../../components/Contact/Contact-Tile';
import { Text } from '../../components/ui/Text/Text';
import { Colors } from '../../app/Colors';
import {
  GroupConversationsComponent,
  maxConnectionsForward,
} from '../../components/Chat/Chat-Forward';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { AuthorName } from '../../components/ui/Name';
import { SendChat } from '../../components/ui/Icons/icons';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { fixContentURI, getImageSize } from '../../utils/utils';
import {
  ConversationWithRecentMessage,
  useConversationsWithRecentMessage,
} from '../../hooks/chat/useConversationsWithRecentMessage';
import ConversationTile from '../../components/Chat/Conversation-tile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConversationTileWithYourself } from '../../components/Conversation/ConversationTileWithYourself';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary/ErrorBoundary';
import {
  SearchConversationResults,
  SearchConversationWithSelectionResults,
} from '../../components/Chat/SearchConversationsResults';

export type ShareChatProp = NativeStackScreenProps<ChatStackParamList, 'ShareChat'>;
export const ShareChatPage = (prop: ShareChatProp) => {
  const sharedData = prop.route.params;
  const { isDarkMode } = useDarkMode();
  const { mutateAsync: createConversation } = useConversation().create;
  const [sending, setSending] = useState(false);
  const { data: connections } = useAllConnections(true);
  const { data: allConversations } = useConversationsWithRecentMessage().all;
  const [query, setQuery] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    prop.navigation.setOptions({
      headerSearchBarOptions: {
        hideWhenScrolling: true,
        headerIconColor: isDarkMode ? Colors.white : Colors.black,
        placeholder: 'Search people',
        hideNavigationBar: true,
        autoCapitalize: 'none',
        onChangeText: (event) => {
          setQuery(event.nativeEvent.text);
        },
        onCancelButtonPress: () => {
          setQuery(undefined);
        },
        onClose: () => {
          setQuery(undefined);
        },
      },
    });
  }, [isDarkMode, prop.navigation]);

  const [selectedContact, setSelectedContact] = useState<DotYouProfile[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    HomebaseFile<UnifiedConversation>[]
  >([]);
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

  const onShare = useCallback(async () => {
    if ((selectedContact.length === 0 && selectedConversation.length === 0) || !sharedData) {
      navigation.goBack();
    }
    setSending(true);
    if (sharedData.find((item) => item.mimeType.startsWith('text'))) {
      const selectedContacts = selectedContact.length;
      const selectedConversations = selectedConversation.length;
      if (selectedContacts + selectedConversations === 1) {
        if (selectedContact.length === 1) {
          const contact = selectedContact[0];
          const conversation = await createConversation({
            recipients: [contact.odinId],
          });
          navigation.dispatch(
            StackActions.replace('ChatScreen', {
              convoId: conversation.fileMetadata.appData.uniqueId as string,
              initialText: sharedData.find((item) => item.mimeType.startsWith('text/'))?.data,
            })
          );
        } else {
          const group = selectedConversation[0];
          navigation.dispatch(
            StackActions.replace('ChatScreen', {
              convoId: group.fileMetadata.appData.uniqueId as string,
              initialText: sharedData.find((item) => item.mimeType.startsWith('text/'))?.data,
            })
          );
        }
        return;
      } else {
        const recipients = selectedConversation;
        for (const contact of selectedContact) {
          recipients.push(
            await createConversation({
              recipients: [contact.odinId],
            })
          );
        }
        navigation.navigate('ShareEditor', {
          text: sharedData.find((item) => item.mimeType.startsWith('text/'))?.data as string,
          recipients: recipients,
        });
      }
    }

    async function getMediaSourceData() {
      const imageSource: ImageSource[] = [];
      for (const item of sharedData) {
        const mimeType = item.mimeType;
        const data = item.data;
        if (mimeType.startsWith('image')) {
          const uri = await fixContentURI(data, mimeType.split('/')[1]);

          const size = await getImageSize(uri);
          imageSource.push({
            uri: uri,
            width: size.width,
            height: size.height,
            type: mimeType,
          });
        } else if (
          mimeType.startsWith('video')
          // TODO: Add support for HLS || mimeType === 'application/vnd.apple.mpegurl'
        ) {
          const uri = await fixContentURI(data, mimeType.split('/')[1]);
          imageSource.push({
            uri: uri,
            width: 1920,
            height: 1080,
            type: mimeType,
          });
        } else if (mimeType.startsWith('application/pdf')) {
          const uri = await fixContentURI(data, mimeType.split('/')[1]);
          imageSource.push({
            uri: uri,
            type: mimeType,
            width: 0,
            height: 0,
          });
        }
      }

      return imageSource;
    }

    const medias = await getMediaSourceData();
    if (medias.length > 0) {
      const conversations = selectedConversation;
      if (selectedContact.length > 0) {
        for (const contact of selectedContact) {
          const conversation = await createConversation({
            recipients: [contact.odinId],
          });
          conversations.push(conversation);
        }
      }
      navigation.dispatch(
        StackActions.replace('ChatFileOverview', {
          initialAssets: medias,
          recipients: conversations,
        })
      );
    }
    setSending(false);
  }, [selectedContact, selectedConversation, sharedData, navigation, createConversation]);

  const { bottom } = useSafeAreaInsets();

  const renderFooter = useCallback(() => {
    return (
      <View
        style={{
          position: 'absolute',
          bottom: bottom,
          zIndex: 100,
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <View style={styles.namesContainer}>
          {selectedConversation.map((group) => {
            const isSingleConversation = group.fileMetadata.appData.content.recipients.length === 2;
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
                {!isSingleConversation ? (
                  group.fileMetadata.appData.content.title
                ) : (
                  <AuthorName odinId={group.fileMetadata.appData.content.recipients[0]} />
                )}
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
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
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
          )}
        </TouchableHighlight>
      </View>
    );
  }, [bottom, isDarkMode, onShare, selectedContact, selectedConversation, sending]);

  const isQueryActive = useMemo(() => !!(query && query.length >= 1), [query]);

  return (
    <SafeAreaView>
      {isQueryActive ? (
        <SearchConversationWithSelectionResults
          query={query}
          allConversations={allConversations || []}
          selectedContact={selectedContact}
          setSelectedContact={setSelectedContact}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
        />
      ) : (
        <InnerShareChatPage
          connections={connections}
          allConversations={allConversations}
          selectedContact={selectedContact}
          setSelectedContact={setSelectedContact}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
        />
      )}
      {selectedContact.length > 0 || selectedConversation.length > 0 ? renderFooter() : undefined}
    </SafeAreaView>
  );
};

// Split up in two components to avoid re-rendering the whole SectionList when the footer is updated; Or when the share function changes
const InnerShareChatPage = memo(
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
                text1: t('Forward limit reached'),
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
                text1: t('Forward limit reached'),
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
              fileId={conversation.fileId}
              previewThumbnail={conversation.fileMetadata.appData.previewThumbnail}
              payloadKey={conversation.fileMetadata.payloads?.[0]?.key}
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
      <SectionList
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
  content: {
    borderRadius: 8,
    alignSelf: 'center',
    flex: 1,
  },
});
