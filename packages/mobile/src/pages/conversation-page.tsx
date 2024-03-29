import { FlatList, StyleSheet } from 'react-native';
import ConversationTile from '../components/Chat/Conversation-tile';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList, ChatStackParamList } from '../app/App';
import { ConversationWithRecentMessage, useConversations } from '../hooks/chat/useConversations';
import {
  ConversationWithYourselfId,
  GroupConversation,
  SingleConversation,
} from '../provider/chat/ConversationProvider';
import { useAuth } from '../hooks/auth/useAuth';
import { useProfile } from '../hooks/profile/useProfile';
import { useLayoutEffect, useMemo, useState } from 'react';
import { useRemoveNotifications } from '../hooks/notifications/usePushNotifications';
import { CHAT_APP_ID } from '../components/Nav/TabStackIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/ui/Text/Text';
import { ScrollView } from 'react-native-gesture-handler';
import { ContactTile } from '../components/Contact/Contact-Tile';
import { useAllContacts } from 'feed-app-common';
import { Colors } from '../app/Colors';
import { useDarkMode } from '../hooks/useDarkMode';

type ConversationProp = NativeStackScreenProps<ChatStackParamList, 'Conversation'>;

const ConversationPage = ({ navigation: rootNavigation }: ConversationProp) => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const { data: conversations } = useConversations().all;

  useRemoveNotifications({ appId: CHAT_APP_ID });

  const flatConversations = useMemo(
    () => conversations?.pages?.flatMap((page) => page.searchResults) || [],
    [conversations]
  );

  const [query, setQuery] = useState<string | undefined>(undefined);
  const isQueryActive = !!(query && query.length >= 1);
  const { isDarkMode } = useDarkMode();

  useLayoutEffect(() => {
    rootNavigation.setOptions({
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
  }, [rootNavigation]);

  if (isQueryActive) {
    return <SearchConversationResults query={query} conversations={flatConversations} />;
  }
  return (
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
  );
};

const ConversationTileWithYourself = () => {
  const user = useProfile().data;
  const odinId = useAuth().getIdentity();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  if (!user) return null;
  return (
    <ConversationTile
      odinId={odinId || ''}
      conversation={{
        title: `${user?.firstName} ${user?.surName} `,
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

const SearchConversationResults = ({
  query,
  conversations,
}: {
  query: string | undefined;
  conversations: ConversationWithRecentMessage[];
}) => {
  const isActive = !!(query && query.length >= 1);

  const { data: contacts } = useAllContacts(isActive);

  const conversationResults =
    query && conversations
      ? conversations.filter((conversation) => {
          const content = conversation.fileMetadata.appData.content;
          return (
            (content as GroupConversation).recipients?.some((recipient) =>
              recipient.includes(query)
            ) || (content as SingleConversation).recipient?.includes(query)
          );
        })
      : [];

  const contactResults =
    query && contacts
      ? contacts
          .map((contact) => contact.fileMetadata.appData.content)
          .filter(
            (contact) =>
              contact.odinId &&
              (contact.odinId?.includes(query) || contact.name?.displayName.includes(query))
          )
      : [];

  const contactsWithoutAConversation = contactResults.filter(
    (contact) =>
      contact.odinId &&
      !conversationResults.some((conversation) => {
        const content = conversation.fileMetadata.appData.content;
        return (content as SingleConversation).recipient === contact.odinId;
      })
  );
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  if (!isActive) return null;

  return (
    <>
      {!conversationResults?.length && !contactsWithoutAConversation?.length ? (
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 12,
            marginTop: 4,
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
          {contactsWithoutAConversation?.length ? <Text style={styles.title}>Contacts</Text> : null}
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
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
    marginTop: 4,
  },
});

export default ConversationPage;
