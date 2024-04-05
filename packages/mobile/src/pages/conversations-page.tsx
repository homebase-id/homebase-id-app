import { FlatList, StyleSheet } from 'react-native';
import ConversationTile from '../components/Chat/Conversation-tile';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../app/App';
import { ConversationWithRecentMessage, useConversations } from '../hooks/chat/useConversations';
import {
  ConversationWithYourselfId,
  GroupConversation,
  SingleConversation,
} from '../provider/chat/ConversationProvider';
import { useAuth } from '../hooks/auth/useAuth';
import { useProfile } from '../hooks/profile/useProfile';
import { memo, useLayoutEffect, useMemo, useState } from 'react';
import { useRemoveNotifications } from '../hooks/notifications/usePushNotifications';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/ui/Text/Text';
import { ScrollView } from 'react-native-gesture-handler';
import { ContactTile } from '../components/Contact/Contact-Tile';
import { useAllContacts } from 'feed-app-common';
import { Colors } from '../app/Colors';
import { useDarkMode } from '../hooks/useDarkMode';
import { CHAT_APP_ID } from '../app/constants';
import { ErrorBoundary } from '../components/ui/ErrorBoundary/ErrorBoundary';

type ConversationProp = NativeStackScreenProps<ChatStackParamList, 'Conversation'>;

export const ConversationsPage = memo(({ navigation }: ConversationProp) => {
  const { data: conversations } = useConversations().all;
  const flatConversations = useMemo(
    () =>
      conversations?.pages
        ?.flatMap((page) => page.searchResults)
        .filter((convo) => [0, undefined].includes(convo.fileMetadata.appData.archivalStatus)) ||
      [],
    [conversations]
  );

  const [query, setQuery] = useState<string | undefined>(undefined);
  const { isDarkMode } = useDarkMode();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        hideWhenScrolling: true,
        headerIconColor: isDarkMode ? Colors.white : Colors.black,
        placeholder: 'Search',
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
  }, [isDarkMode, navigation]);

  const isQueryActive = !!(query && query.length >= 1);
  if (isQueryActive) {
    return (
      <ErrorBoundary>
        <SearchConversationResults query={query} conversations={flatConversations} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <RemoveNotifications />
      <FlatList
        data={flatConversations}
        keyExtractor={(item) => item.fileId}
        ListHeaderComponent={ConversationTileWithYourself}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item }) => (
          <ConversationTile
            conversation={item.fileMetadata.appData.content}
            conversationId={item.fileMetadata.appData.uniqueId}
            onPress={() => {
              if (item.fileMetadata.appData.uniqueId) {
                navigation.navigate('ChatScreen', {
                  convoId: item.fileMetadata.appData.uniqueId,
                });
              }
            }}
            odinId={(item.fileMetadata.appData.content as SingleConversation).recipient}
          />
        )}
      />
    </ErrorBoundary>
  );
});

const RemoveNotifications = memo(() => {
  useRemoveNotifications({ appId: CHAT_APP_ID });
  return null;
});

const ConversationTileWithYourself = () => {
  const { data: profile } = useProfile();
  const odinId = useAuth().getIdentity();
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

  return (
    <ConversationTile
      odinId={odinId || ''}
      conversation={{
        title: profile ? `${profile?.firstName} ${profile?.surName} ` : '',
        recipient: '',
      }}
      conversationId={ConversationWithYourselfId}
      isSelf
      onPress={() =>
        navigation.navigate('ChatScreen', {
          convoId: ConversationWithYourselfId,
        })
      }
    />
  );
};

const SearchConversationResults = memo(
  ({
    query,
    conversations,
  }: {
    query: string | undefined;
    conversations: ConversationWithRecentMessage[];
  }) => {
    const isActive = !!(query && query.length >= 1);
    const { data: contacts } = useAllContacts(isActive);

    const conversationResults = useMemo(
      () =>
        query && conversations
          ? conversations.filter((conversation) => {
              const content = conversation.fileMetadata.appData.content;
              return (
                (content as GroupConversation).recipients?.some((recipient) =>
                  recipient.includes(query)
                ) || (content as SingleConversation).recipient?.includes(query)
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
              .filter(
                (contact) =>
                  contact.odinId &&
                  (contact.odinId?.includes(query) || contact.name?.displayName.includes(query))
              )
          : [],
      [contacts, query]
    );

    const contactsWithoutAConversation = useMemo(
      () =>
        contactResults.filter(
          (contact) =>
            contact.odinId &&
            !conversationResults.some((conversation) => {
              const content = conversation.fileMetadata.appData.content;
              return (content as SingleConversation).recipient === contact.odinId;
            })
        ),
      [contactResults, conversationResults]
    );
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

    if (!isActive) return null;

    return (
      <>
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
                onPress={() => {
                  if (item.fileMetadata.appData.uniqueId) {
                    navigation.navigate('ChatScreen', {
                      convoId: item.fileMetadata.appData.uniqueId,
                    });
                  }
                }}
                odinId={(item.fileMetadata.appData.content as SingleConversation).recipient}
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
              />
            ))}
          </ScrollView>
        )}
      </>
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
