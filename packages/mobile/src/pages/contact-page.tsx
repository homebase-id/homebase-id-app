import { FlatList } from 'react-native-gesture-handler';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../app/App';

import { useAllContacts } from 'chat-app-common';

import { ContactTile, Tile } from '../components/ui/Contact/Contact-Tile';
import { Globe, Users } from '../components/ui/Icons/Icons';

const ListHeaderComponent = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <>
      <Tile
        title="New Group"
        onClick={() => {
          navigation.navigate('NewGroup');
        }}
        icon={<Users size={'lg'} />}
      />
      <Tile
        title="Pending Requests"
        onClick={() => {
          navigation.navigate('PendingRequests');
        }}
        icon={<Globe size={'lg'} />}
      />
      <Tile
        title="Sent Requests"
        onClick={() => {
          navigation.navigate('SentRequests');
        }}
        icon={<Globe size={'lg'} />}
      />
    </>
  );
};

export const ContactPage = ({
  navigation,
}: {
  navigation: NavigationProp<RootStackParamList, 'NewChat'>;
}) => {
  const contacts = useAllContacts(true).data;
  if (!contacts) return null;
  return (
    <>
      <FlatList
        data={contacts}
        keyExtractor={item => item.fileId}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({ item }) => (
          <ContactTile
            item={item}
            onOpen={conversationId => {
              navigation.goBack();
              navigation.navigate('ChatScreen', {
                convoId: conversationId,
              });
            }}
          />
        )}
      />
    </>
  );
};
