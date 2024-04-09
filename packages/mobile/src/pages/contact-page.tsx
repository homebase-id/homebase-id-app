import { FlatList } from 'react-native-gesture-handler';

import { ListRenderItemInfo, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../app/App';

import { useAllConnections } from 'feed-app-common';

import { ContactTile, Tile } from '../components/Contact/Contact-Tile';
import { Users } from '../components/ui/Icons/icons';
import { memo, useCallback } from 'react';
import { DotYouProfile } from '@youfoundation/js-lib/network';

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
    const connections = useAllConnections(true).data;
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
      <FlatList
        data={connections}
        keyExtractor={(item) => item.odinId}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={renderItem}
      />
    );
  }
);
