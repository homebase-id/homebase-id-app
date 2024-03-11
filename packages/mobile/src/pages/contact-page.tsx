import { FlatList } from 'react-native-gesture-handler';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList, ChatStackParamList } from '../app/App';

import { useAllConnections } from 'feed-app-common';

import { ContactTile, Tile } from '../components/ui/Contact/Contact-Tile';
import { Users } from '../components/ui/Icons/icons';

const ListHeaderComponent = () => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  return (
    <>
      <Tile
        title="New Group"
        onClick={() => {
          navigation.navigate('NewGroup');
        }}
        icon={<Users size={'lg'} />}
      />
    </>
  );
};

export const ContactPage = ({
  navigation,
}: {
  navigation: NavigationProp<ChatStackParamList, 'NewChat'>;
}) => {
  const connections = useAllConnections(true).data;
  const nav = useNavigation<NavigationProp<AppStackParamList>>();
  if (!connections) return null;
  return (
    <>
      <FlatList
        data={connections}
        keyExtractor={(item) => item.odinId}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({ item }) => (
          <ContactTile
            item={item}
            onOpen={(conversationId) => {
              navigation.goBack();
              nav.navigate('ChatScreen', {
                convoId: conversationId,
              });
            }}
          />
        )}
      />
    </>
  );
};
