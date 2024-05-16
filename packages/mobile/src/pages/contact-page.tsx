import { FlatList } from 'react-native-gesture-handler';

import { ListRenderItemInfo, Platform, RefreshControl, StatusBar, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../app/ChatStack';

import { useAllConnections } from 'feed-app-common';

import { ContactTile, Tile } from '../components/Contact/Contact-Tile';
import { Users } from '../components/ui/Icons/icons';
import { memo, useCallback, useEffect, useState } from 'react';
import { DotYouProfile } from '@youfoundation/js-lib/network';
import { SafeAreaView } from '../components/ui/SafeAreaView/SafeAreaView';

const ListHeaderComponent = () => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
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
  ({ navigation }: { navigation: NavigationProp<ChatStackParamList, 'NewChat'> }) => {
    const { data: connections, refetch, status } = useAllConnections(true);
    const [refreshing, setRefreshing] = useState(false);

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
            navigation.navigate('ChatScreen', {
              convoId: conversationId,
            });
          }}
        />
      ),
      [navigation]
    );

    if (!connections) return null;

    return (
      <SafeAreaView>
        {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
        <FlatList
          data={connections}
          keyExtractor={(item) => item.odinId}
          ListHeaderComponent={ListHeaderComponent}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
        />
      </SafeAreaView>
    );
  }
);
