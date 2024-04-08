import { useAllConnections } from 'feed-app-common';
import { FlatList, Platform, Text } from 'react-native';
import { ContactTile } from '../components/Contact/Contact-Tile';

import { memo, useCallback, useState } from 'react';
import { Header, HeaderBackButtonProps } from '@react-navigation/elements';
import { BackButton } from '../components/ui/convo-app-bar';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../app/App';
import { useConversation } from '../hooks/chat/useConversation';
import Dialog from 'react-native-dialog';
import { DotYouProfile } from '@youfoundation/js-lib/network';
import { useDarkMode } from '../hooks/useDarkMode';
import { Colors } from '../app/Colors';

export const NewGroupPage = memo(() => {
  const contacts = useAllConnections(true).data;
  const [dialogVisible, setDialogVisible] = useState(false);

  const [selectedContacts, setSetselectedContacts] = useState<DotYouProfile[]>([]);
  const navigation = useNavigation<NavigationProp<ChatStackParamList, 'NewChat'>>();

  const { mutateAsync: createNew } = useConversation().create;

  const [groupTitle, setgroupTitle] = useState<string>();

  const createGroupCallback = useCallback(async () => {
    const { newConversationId } = await createNew({
      recipients: selectedContacts.map((contact) => contact.odinId as string),
      title: groupTitle,
    });
    if (newConversationId) {
      setDialogVisible(false);
      navigation.goBack();
      navigation.goBack();
      navigation.navigate('ChatScreen', {
        convoId: newConversationId,
      });
    }
  }, [createNew, navigation, selectedContacts, groupTitle]);

  const headerLeft = useCallback(
    (props: HeaderBackButtonProps) => {
      return BackButton({
        onPress: () => navigation.goBack(),
        prop: props,
        label: '',
        style: { marginLeft: 10 },
      });
    },
    [navigation]
  );

  const headerRight = useCallback(
    () =>
      CreateGroup({
        disabled: selectedContacts.length < 2,
        onPress: async () => {
          if (selectedContacts.length === 0) return;
          setDialogVisible(true);
        },
      }),
    [selectedContacts.length]
  );

  if (!contacts) return null;

  return (
    <>
      <Header
        title="New Group"
        headerStatusBarHeight={Platform.OS === 'ios' ? 10 : 0}
        headerLeft={headerLeft}
        headerRight={headerRight}
      />
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.odinId}
        renderItem={({ item }) => (
          <ContactTile
            item={item}
            selectMode
            isSelected={selectedContacts.includes(item)}
            onPress={() => {
              if (selectedContacts.includes(item)) {
                setSetselectedContacts(selectedContacts.filter((contact) => contact !== item));
              } else setSetselectedContacts([...selectedContacts, item]);
            }}
          />
        )}
      />
      <Dialog.Container visible={dialogVisible} onBackdropPress={() => setDialogVisible(false)}>
        <Dialog.Title>New Group Name</Dialog.Title>
        <Dialog.Input
          onChangeText={(value) => {
            setgroupTitle(value);
          }}
        />
        <Dialog.Button
          label="Cancel"
          onPress={() => {
            setDialogVisible(false);
          }}
        />
        <Dialog.Button label="Create" onPress={createGroupCallback} />
      </Dialog.Container>
    </>
  );
});

function CreateGroup(props: { disabled: boolean; onPress: () => void }) {
  const { isDarkMode } = useDarkMode();

  return (
    <TouchableOpacity disabled={props.disabled} onPress={props.onPress}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '500',
          marginRight: 10,
          color: props.disabled ? 'grey' : isDarkMode ? Colors.white : Colors.black,
        }}
      >
        Create
      </Text>
    </TouchableOpacity>
  );
}
