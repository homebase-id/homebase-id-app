import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import ConversationTile from '../components/Chat/Conversation-tile';

import { NavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../app/App';
import {
  ConversationWithRecentMessage,
  useConversationsWithRecentMessage,
} from '../hooks/chat/useConversations';
import {
  ConversationWithYourselfId,
  GroupConversation,
  SingleConversation,
} from '../provider/chat/ConversationProvider';
import { useAuth } from '../hooks/auth/useAuth';
import { useProfile } from '../hooks/profile/useProfile';
import { memo, useCallback, useLayoutEffect, useMemo, useState } from 'react';
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
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { Pencil } from '../components/ui/Icons/icons';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';

type ConversationProp = NativeStackScreenProps<ChatStackParamList, 'Conversation'>;

export const ConversationsPage = memo(({ navigation }: ConversationProp) => {
  const { data: conversations } = useConversationsWithRecentMessage().all;
  const [query, setQuery] = useState<string | undefined>(undefined);
  const { isDarkMode } = useDarkMode();
  const queryClient = useQueryClient();

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

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ConversationWithRecentMessage>) => (
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
    ),
    [navigation]
  );

  const keyExtractor = useCallback((item: ConversationWithRecentMessage) => item.fileId, []);

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = useCallback(async () => {
    setRefreshing(true);

    const queries = queryClient.getQueriesData({ queryKey: ['chat-messages'], exact: false });
    queries.forEach(([key]) => {
      if (Object.values(key) && Object.values(key) !== null) {
        queryClient.setQueryData(key, (data: InfiniteData<unknown, unknown>) => {
          return {
            pages: data?.pages?.slice(0, 1) ?? [],
            pageParams: data?.pageParams?.slice(0, 1) || [undefined],
          };
        });
      }
    });
    await queryClient.invalidateQueries({ queryKey: ['chat-messages'], exact: false });
    await queryClient.invalidateQueries({ queryKey: ['conversations'] });

    setRefreshing(false);
  }, [queryClient]);

  const isQueryActive = !!(query && query.length >= 1);
  if (isQueryActive) {
    return (
      <ErrorBoundary>
        <SearchConversationResults query={query} conversations={conversations} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView>
        <RemoveNotifications />
        <FloatingActionButton />
        <FlatList
          data={conversations}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ConversationTileWithYourself}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
});

const FloatingActionButton = memo(() => {
  const { isDarkMode } = useDarkMode();
  const backgroundColor = useMemo(
    () => (isDarkMode ? Colors.indigo[700] : Colors.indigo[200]),
    [isDarkMode]
  );
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  const onPress = useCallback(() => {
    navigation.navigate('NewChat');
  }, [navigation]);
  if (Platform.OS === 'ios') return;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 32,
        right: 12,
        padding: 16,
        borderRadius: 15,
        backgroundColor: backgroundColor,
        zIndex: 100,
      }}
    >
      <TouchableOpacity onPress={onPress}>
        <Pencil size={'md'} />
      </TouchableOpacity>
    </View>
  );
});

const RemoveNotifications = memo(() => {
  const isFocused = useIsFocused();
  useRemoveNotifications({ appId: CHAT_APP_ID, enabled: isFocused });
  return null;
});

const ConversationTileWithYourself = memo(() => {
  const { data: profile } = useProfile();
  const odinId = useAuth().getIdentity();
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

  const doOpen = useCallback(
    () =>
      navigation.navigate('ChatScreen', {
        convoId: ConversationWithYourselfId,
      }),
    [navigation]
  );

  return (
    <ConversationTile
      odinId={odinId || ''}
      conversation={{
        title: profile ? `${profile?.firstName} ${profile?.surName} ` : '',
        recipient: '',
      }}
      conversationId={ConversationWithYourselfId}
      isSelf
      onPress={doOpen}
    />
  );
});

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
                  recipient.toLowerCase().includes(query.toLowerCase())
                ) ||
                (content as SingleConversation).recipient
                  ?.toLowerCase()
                  ?.includes(query.toLowerCase())
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
                  (contact.odinId?.includes(query) ||
                    contact.name?.displayName?.toLowerCase().includes(query.toLowerCase()))
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
              return (
                (content as SingleConversation).recipient.toLowerCase() ===
                contact.odinId?.toLowerCase()
              );
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
                onOpen={(convoId) => {
                  navigation.navigate('ChatScreen', {
                    convoId,
                  });
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
