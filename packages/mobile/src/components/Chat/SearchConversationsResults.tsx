import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAllContacts, useDotYouClientContext } from 'homebase-id-app-common';
import { memo, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ChatStackParamList } from '../../app/ChatStack';
import { ConversationWithRecentMessage } from '../../hooks/chat/useConversationsWithRecentMessage';
import { ContactTile } from '../Contact/Contact-Tile';
import ConversationTile from './Conversation-tile';
import { Text } from '../ui/Text/Text';
import { SafeAreaView } from '../ui/SafeAreaView/SafeAreaView';

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

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
    marginTop: 4,
  },
});
