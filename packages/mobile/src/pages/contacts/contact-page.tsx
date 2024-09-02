import { FlatList } from 'react-native-gesture-handler';

import {
  ListRenderItemInfo,
  Platform,
  RefreshControl,
  StatusBar,
  View,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { useAllConnections } from 'feed-app-common';
import { ChatStackParamList, NewChatStackParamList } from '../../app/ChatStack';
import { ContactTile, Tile } from '../../components/Contact/Contact-Tile';
import { Users } from '../../components/ui/Icons/icons';
import { memo, useCallback, useEffect, useState } from 'react';
import { DotYouProfile } from '@homebase-id/js-lib/network';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { NoContacts } from '../../components/Contact/NoContacts';

const ListHeaderComponent = () => {
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
};

export const ContactPage = memo(
  ({ navigation }: { navigation: NavigationProp<NewChatStackParamList, 'NewChat'> }) => {
    const { data: connections, refetch, status } = useAllConnections(true);
    const [refreshing, setRefreshing] = useState(false);
    const nav = useNavigation<NavigationProp<ChatStackParamList>>();

    useEffect(() => {
      if (status === 'success') {
        setRefreshing(false);
      }
    }, [status]);

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

    if (!connections) return null;

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
  }
);
