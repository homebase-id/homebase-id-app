import { FlatList } from 'react-native-gesture-handler';

import { ListRenderItemInfo, Platform, RefreshControl, StatusBar, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { useAllConnections } from 'homebase-id-app-common';
import { ChatStackParamList, NewChatStackParamList } from '../../app/ChatStack';
import { ContactTile, Tile } from '../../components/Contact/Contact-Tile';
import { Users } from '../../components/ui/Icons/icons';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { DotYouProfile } from '@homebase-id/js-lib/network';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { NoContacts } from '../../components/Contact/NoContacts';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary/ErrorBoundary';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchConversationResults } from '../../components/Chat/SearchConversationsResults';

const ListHeaderComponent = memo(() => {
  const navigation = useNavigation<NavigationProp<NewChatStackParamList>>();
  return (
    <View style={{ marginTop: 3 }}>
      <Tile
        title="New Group"
        onClick={() => {
          navigation.navigate('NewGroup');
        }}
        icon={<Users size={'lg'} />}
      />
    </View>
  );
});

type ContactPageProp = NativeStackScreenProps<NewChatStackParamList, 'NewChat'>;

export const ContactPage = memo(({ navigation }: ContactPageProp) => {
  const { data: connections, refetch, status } = useAllConnections(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState<string | undefined>(undefined);
  const nav = useNavigation<NavigationProp<ChatStackParamList>>();
  const { isDarkMode } = useDarkMode();
  useEffect(() => {
    if (status === 'success') {
      setRefreshing(false);
    }
  }, [status]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        hideWhenScrolling: false,
        headerIconColor: isDarkMode ? Colors.white : Colors.black,
        placeholder: 'Search contacts',
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
    ({ item }: ListRenderItemInfo<DotYouProfile>) => (
      <ContactTile
        item={item}
        onOpen={(conversationId) => {
          navigation.goBack();
          setTimeout(() => {
            nav.navigate('ChatScreen', {
              convoId: conversationId,
            });
          }, 100);
        }}
      />
    ),
    [nav, navigation]
  );
  const isQueryActive = useMemo(() => !!(query && query.length >= 1), [query]);

  if (!connections) return null;

  if (isQueryActive) {
    return (
      <ErrorBoundary>
        <SearchConversationResults query={query} conversations={[]} />
      </ErrorBoundary>
    );
  }

  return (
    <SafeAreaView>
      {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
      <FlatList
        data={connections}
        keyExtractor={(item) => item.odinId}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={<NoContacts />}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
      />
    </SafeAreaView>
  );
});
