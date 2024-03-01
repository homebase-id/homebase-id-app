import { FlatList } from 'react-native-gesture-handler';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../app/App';

import { useAllContacts } from 'feed-app-common';

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
  const contacts = useAllContacts(true).data;
  if (!contacts) return null;
  console.log(
    'contacts',
    contacts.map((c) => c.fileMetadata.appData.content.odinId)
  );
  return (
    <>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.fileId}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({ item }) => (
          <ContactTile
            item={item}
            onOpen={(conversationId) => {
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
