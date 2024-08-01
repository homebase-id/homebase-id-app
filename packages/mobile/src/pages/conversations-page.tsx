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
import { ChatStackParamList } from '../app/ChatStack';
import {
  ConversationWithRecentMessage,
  useConversationsWithRecentMessage,
} from '../hooks/chat/useConversationsWithRecentMessage';
import { ConversationWithYourselfId } from '../provider/chat/ConversationProvider';
import { useAuth } from '../hooks/auth/useAuth';
import { useProfile } from '../hooks/profile/useProfile';
import { memo, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useRemoveNotifications } from '../hooks/notifications/usePushNotifications';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/ui/Text/Text';
import { ScrollView } from 'react-native-gesture-handler';
import { ContactTile } from '../components/Contact/Contact-Tile';
import { t, useAllContacts, useDotYouClientContext } from 'feed-app-common';
import { Colors } from '../app/Colors';
import { useDarkMode } from '../hooks/useDarkMode';
import { CHAT_APP_ID } from '../app/constants';
import { ErrorBoundary } from '../components/ui/ErrorBoundary/ErrorBoundary';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { Pencil, People } from '../components/ui/Icons/icons';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';
import { openURL } from '../utils/utils';
import { OfflineState } from '../components/Platform/OfflineState';

type ConversationProp = NativeStackScreenProps<ChatStackParamList, 'Conversation'>;

export const ConversationsPage = memo(({ navigation }: ConversationProp) => {
  const { data: conversations, isFetched: conversationsFetched } =
    useConversationsWithRecentMessage().all;
  const { data: contacts, refetch } = useAllContacts(
    conversationsFetched && (!conversations || !conversations?.length)
  );

  const noContacts = !contacts || contacts.length === 0;

  const [query, setQuery] = useState<string | undefined>(undefined);
  const { isDarkMode } = useDarkMode();
  const queryClient = useQueryClient();
  const identity = useDotYouClientContext().getIdentity();

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
    ({ item }: ListRenderItemInfo<ConversationWithRecentMessage>) => {
      const hasPayload = item.fileMetadata.payloads?.length > 0;
      return (
        <ConversationTile
          conversation={item.fileMetadata.appData.content}
          conversationId={item.fileMetadata.appData.uniqueId}
          fileId={item.fileId}
          payloadKey={hasPayload ? item.fileMetadata.payloads[0].key : undefined}
          onPress={() => {
            if (item.fileMetadata.appData.uniqueId) {
              navigation.navigate('ChatScreen', {
                convoId: item.fileMetadata.appData.uniqueId,
              });
            }
          }}
          odinId={
            item.fileMetadata.appData.content.recipients.filter(
              (recipient) => recipient !== identity
            )[0]
          }
        />
      );
    },
    [identity, navigation]
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
    await queryClient.invalidateQueries({ queryKey: ['connections'] });

    if (noContacts) {
      refetch();
    }

    setRefreshing(false);
  }, [noContacts, queryClient, refetch]);

  const isQueryActive = !!(query && query.length >= 1);
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
          <FlatList
            data={conversations}
            keyExtractor={keyExtractor}
            contentInsetAdjustmentBehavior="automatic"
            ListHeaderComponent={<ConversationTileWithYourself />}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
          />
        ) : conversationsFetched ? (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
            style={{ flex: 1 }}
          >
            <ConversationTileWithYourself />
            {noContacts ? (
              <View style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ color: Colors.gray[400], fontStyle: 'italic' }}>
                  {t('To chat with someone on Homebase you need to be connected first.')}
                </Text>
                <TouchableOpacity
                  style={{
                    gap: 8,
                    flexDirection: 'row',
                    marginLeft: 'auto',
                  }}
                  onPress={() => openURL(`https://${identity}/owner/connections`)}
                >
                  <Text>{t('Connect')}</Text>
                  <People />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                <Text style={{ color: Colors.gray[400], fontStyle: 'italic' }}>
                  {t('No conversations found')}
                </Text>
              </View>
            )}
          </ScrollView>
        ) : null}
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

export const ConversationTileWithYourself = memo(
  ({
    selecMode: selectMode,
    isSelected,
    onPress,
  }: {
    selecMode?: boolean;
    isSelected?: boolean;
    onPress?: () => void;
  }) => {
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
          recipients: [],
        }}
        conversationId={ConversationWithYourselfId}
        isSelf
        isSelected={isSelected}
        selectMode={selectMode}
        onPress={selectMode ? onPress : doOpen}
      />
    );
  }
);

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
              return content.recipients.includes(contact.odinId as string);
            })
        ),
      [contactResults, conversationResults]
    );
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

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
                onPress={() => {
                  if (item.fileMetadata.appData.uniqueId) {
                    navigation.navigate('ChatScreen', {
                      convoId: item.fileMetadata.appData.uniqueId,
                    });
                  }
                }}
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
                onOpen={(convoId) => {
                  navigation.navigate('ChatScreen', {
                    convoId,
                  });
                }}
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
