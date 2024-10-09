import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import ConversationTile from '../components/Chat/Conversation-tile';

import {
  NavigationProp,
  useIsFocused,
  useNavigation,
  useScrollToTop,
} from '@react-navigation/native';
import { ChatStackParamList } from '../app/ChatStack';
import {
  ConversationWithRecentMessage,
  useConversationsWithRecentMessage,
} from '../hooks/chat/useConversationsWithRecentMessage';
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRemoveNotifications } from '../hooks/notifications/usePushNotifications';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/ui/Text/Text';
import { ScrollView } from 'react-native-gesture-handler';
import { ContactTile } from '../components/Contact/Contact-Tile';
import { useAllContacts, useDotYouClientContext } from 'homebase-id-app-common';
import { Colors } from '../app/Colors';
import { useDarkMode } from '../hooks/useDarkMode';
import { CHAT_APP_ID } from '../app/constants';
import { ErrorBoundary } from '../components/ui/ErrorBoundary/ErrorBoundary';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { Pencil } from '../components/ui/Icons/icons';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import { OfflineState } from '../components/Platform/OfflineState';
import { ConversationTileWithYourself } from '../components/Conversation/ConversationTileWithYourself';
import { EmptyConversation } from '../components/Conversation/EmptyConversation';
import Animated, { LinearTransition } from 'react-native-reanimated';

type ConversationProp = NativeStackScreenProps<ChatStackParamList, 'Conversation'>;

export const ConversationsPage = memo(({ navigation }: ConversationProp) => {
  const { data: conversations, isFetched: conversationsFetched } =
    useConversationsWithRecentMessage().all;

  const [query, setQuery] = useState<string | undefined>(undefined);
  const { isDarkMode } = useDarkMode();
  const queryClient = useQueryClient();
  const identity = useDotYouClientContext().getIdentity();

  const scrollRef = useRef<FlatList<ConversationWithRecentMessage>>(null);
  useScrollToTop(scrollRef);

  useLayoutEffect(() => {
    navigation.setOptions({
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
  }, [isDarkMode, navigation]);

  const onPress = useCallback(
    (convoId: string) => {
      navigation.navigate('ChatScreen', {
        convoId: convoId,
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ConversationWithRecentMessage>) => {
      const hasPayload = item.fileMetadata.payloads?.length > 0;
      return (
        <ConversationTile
          conversation={item.fileMetadata.appData.content}
          conversationId={item.fileMetadata.appData.uniqueId}
          fileId={item.fileId}
          payloadKey={hasPayload ? item.fileMetadata.payloads[0].key : undefined}
          onPress={onPress}
          odinId={
            item.fileMetadata.appData.content.recipients.filter(
              (recipient) => recipient !== identity
            )[0]
          }
        />
      );
    },
    [identity, onPress]
  );

  const keyExtractor = useCallback((item: ConversationWithRecentMessage) => item.fileId, []);

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = useCallback(async () => {
    setRefreshing(true);

    const queries = queryClient.getQueriesData({ queryKey: ['chat-messages'], exact: false });
    queries.forEach(([key]) => {
      if (Object.values(key) && Object.values(key) !== null) {
        queryClient.setQueryData(key, (data: InfiniteData<unknown, unknown>) => {
          if (data?.pages?.length === 0) return data;
          return {
            pages: data?.pages?.slice(0, 1) ?? [],
            pageParams: data?.pageParams?.slice(0, 1) || [undefined],
          };
        });
      }
    });
    await queryClient.invalidateQueries({ queryKey: ['chat-messages'], exact: false });
    await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    await queryClient.invalidateQueries({ queryKey: ['connections'] });

    setRefreshing(false);
  }, [queryClient]);
  const isQueryActive = useMemo(() => !!(query && query.length >= 1), [query]);
  if (isQueryActive) {
    return (
      <ErrorBoundary>
        <SearchConversationResults query={query} conversations={conversations || []} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView>
        <RemoveNotifications />
        <FloatingActionButton />
        <OfflineState />
        {conversations && conversations?.length ? (
          <Animated.FlatList
            ref={scrollRef}
            itemLayoutAnimation={LinearTransition}
            data={conversations}
            showsVerticalScrollIndicator={false}
            keyExtractor={keyExtractor}
            contentInsetAdjustmentBehavior="automatic"
            ListHeaderComponent={<ConversationTileWithYourself />}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
          />
        ) : (
          <EmptyConversation conversationsFetched={conversationsFetched} />
        )}
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
    navigation.navigate('New');
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
  useRemoveNotifications({ appId: CHAT_APP_ID, disabled: !isFocused });
  return null;
});

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
