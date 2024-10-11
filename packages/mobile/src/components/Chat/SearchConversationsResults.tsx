import { useNavigation, NavigationProp } from '@react-navigation/native';
import { t, useAllContacts, useDotYouClientContext } from 'homebase-id-app-common';
import { memo, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ChatStackParamList } from '../../app/ChatStack';
import { ConversationWithRecentMessage } from '../../hooks/chat/useConversationsWithRecentMessage';
import { ContactTile } from '../Contact/Contact-Tile';
import ConversationTile from './Conversation-tile';
import { Text } from '../ui/Text/Text';
import { SafeAreaView } from '../ui/SafeAreaView/SafeAreaView';
import { DotYouProfile } from '@homebase-id/js-lib/network';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import { UnifiedConversation } from '../../provider/chat/ConversationProvider';
import Toast from 'react-native-toast-message';
import { maxConnectionsForward } from './Chat-Forward';

export const SearchConversationResults = memo(
  ({
    query,
    conversations,
  }: {
    query: string | undefined;
    conversations: ConversationWithRecentMessage[];
  }) => {
    const isActive = useMemo(() => !!(query && query.length >= 1), [query]);
    const { data: contacts } = useAllContacts(isActive);
    query = query?.trim().toLowerCase();
    const identity = useDotYouClientContext().getIdentity();
    const conversationResults = useMemo(
      () =>
        query && conversations
          ? conversations.filter((conversation) => {
              const content = conversation.fileMetadata.appData.content;
              return (
                content.recipients?.some((recipient) => recipient?.toLowerCase().includes(query)) ||
                content.title?.toLowerCase().includes(query)
              );
            })
          : [],
      [conversations, query]
    );

    const contactResults = useMemo(
      () =>
        query && contacts
          ? contacts
              .map((contact) => contact.fileMetadata.appData.content)
              .filter((contact) => {
                return (
                  contact.odinId &&
                  (contact.odinId?.includes(query) ||
                    contact.name?.displayName?.toLowerCase().includes(query) ||
                    contact.name?.givenName?.toLowerCase().includes(query) ||
                    contact.name?.surname?.toLowerCase().includes(query))
                );
              })
          : [],
      [contacts, query]
    );

    const contactsWithoutAConversation = useMemo(
      () =>
        contactResults.filter((contact) => {
          // filter conversations which have should not have more than 1 recipient
          const singleConversations = conversationResults.filter((conversation) => {
            const content = conversation.fileMetadata.appData.content;
            return content.recipients.length === 2;
          });
          return (
            contact.odinId &&
            !singleConversations.some((conversation) => {
              const content = conversation.fileMetadata.appData.content;
              return content.recipients.includes(contact.odinId as string);
            })
          );
        }),
      [contactResults, conversationResults]
    );
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const onPress = useCallback(
      (convoId: string) => {
        navigation.navigate('ChatScreen', {
          convoId: convoId,
        });
      },
      [navigation]
    );

    if (!isActive) return null;

    return (
      <SafeAreaView>
        {!conversationResults?.length && !contactsWithoutAConversation?.length ? (
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              display: 'flex',
              marginTop: 'auto',
              marginBottom: 'auto',
              alignSelf: 'center',
            }}
          >
            No Contacts Found
          </Text>
        ) : (
          <ScrollView contentInsetAdjustmentBehavior="automatic">
            {conversationResults?.length ? <Text style={styles.title}>Chats</Text> : null}
            {conversationResults.map((item) => (
              <ConversationTile
                key={item.fileId}
                conversation={item.fileMetadata.appData.content}
                conversationId={item.fileMetadata.appData.uniqueId}
                onPress={onPress}
                odinId={
                  item.fileMetadata.appData.content.recipients.filter(
                    (recipient) => recipient !== identity
                  )[0]
                }
              />
            ))}
            {contactsWithoutAConversation?.length ? (
              <Text style={styles.title}>Contacts</Text>
            ) : null}
            {contactsWithoutAConversation.map((item) => (
              <ContactTile
                key={item.odinId}
                item={{
                  odinId: item.odinId as string,
                }}
                onOpen={onPress}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
);

export const SearchConversationWithSelectionResults = memo(
  ({
    query,
    allConversations: conversations,
    selectedContact,
    setSelectedContact,
    selectedConversation,
    setSelectedConversation,
  }: {
    query: string | undefined;
    allConversations: ConversationWithRecentMessage[] | undefined;
    selectedContact: DotYouProfile[];
    setSelectedContact: React.Dispatch<React.SetStateAction<DotYouProfile[]>>;
    selectedConversation: HomebaseFile<UnifiedConversation>[];
    setSelectedConversation: React.Dispatch<
      React.SetStateAction<HomebaseFile<UnifiedConversation>[]>
    >;
  }) => {
    const isActive = useMemo(() => !!(query && query.length >= 1), [query]);
    const { data: contacts } = useAllContacts(isActive);
    query = query?.trim().toLowerCase();
    const identity = useDotYouClientContext().getIdentity();
    const conversationResults = useMemo(
      () =>
        query && conversations
          ? conversations.filter((conversation) => {
              const content = conversation.fileMetadata.appData.content;
              return (
                content.recipients?.some((recipient) => recipient?.toLowerCase().includes(query)) ||
                content.title?.toLowerCase().includes(query)
              );
            })
          : [],
      [conversations, query]
    );

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
      (contact: string) => {
        setSelectedContact((selectedContact) => {
          if (selectedContact.some((c) => c.odinId === contact)) {
            return selectedContact.filter((c) => c.odinId !== contact);
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
            return [
              ...selectedContact,
              {
                odinId: contact,
              },
            ];
          }
        });
      },
      [setSelectedContact, selectedConversation.length]
    );

    const contactResults = useMemo(
      () =>
        query && contacts
          ? contacts
              .map((contact) => contact.fileMetadata.appData.content)
              .filter((contact) => {
                return (
                  contact.odinId &&
                  (contact.odinId?.includes(query) ||
                    contact.name?.displayName?.toLowerCase().includes(query) ||
                    contact.name?.givenName?.toLowerCase().includes(query) ||
                    contact.name?.surname?.toLowerCase().includes(query))
                );
              })
          : [],
      [contacts, query]
    );

    const contactsWithoutAConversation = useMemo(
      () =>
        contactResults.filter((contact) => {
          // filter conversations which have should not have more than 1 recipient
          const singleConversations = conversationResults.filter((conversation) => {
            const content = conversation.fileMetadata.appData.content;
            return content.recipients.length === 2;
          });
          return (
            contact.odinId &&
            !singleConversations.some((conversation) => {
              const content = conversation.fileMetadata.appData.content;
              return content.recipients.includes(contact.odinId as string);
            })
          );
        }),
      [contactResults, conversationResults]
    );
    if (!isActive) return null;

    return (
      <SafeAreaView>
        {!conversationResults?.length && !contactsWithoutAConversation?.length ? (
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              display: 'flex',
              marginTop: 'auto',
              marginBottom: 'auto',
              alignSelf: 'center',
            }}
          >
            No Contacts Found
          </Text>
        ) : (
          <ScrollView contentInsetAdjustmentBehavior="automatic">
            {conversationResults?.length ? <Text style={styles.title}>Chats</Text> : null}
            {conversationResults.map((item) => (
              <ConversationTile
                key={item.fileId}
                conversation={item.fileMetadata.appData.content}
                conversationId={item.fileMetadata.appData.uniqueId}
                selectMode
                isSelected={selectedConversation.some(
                  (conversation) =>
                    conversation.fileMetadata.appData.uniqueId ===
                    item.fileMetadata.appData.uniqueId
                )}
                onPress={() => onSelectConversation(item)}
                odinId={
                  item.fileMetadata.appData.content.recipients.filter(
                    (recipient) => recipient !== identity
                  )[0]
                }
              />
            ))}
            {contactsWithoutAConversation?.length ? (
              <Text style={styles.title}>Contacts</Text>
            ) : null}
            {contactsWithoutAConversation.map((item) => (
              <ContactTile
                key={item.odinId}
                item={{
                  odinId: item.odinId as string,
                }}
                selectMode
                isSelected={selectedContact.some((contact) => contact.odinId === item.odinId)}
                onPress={() => onSelectContact(item.odinId as string)}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
);

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
    marginTop: 4,
  },
});