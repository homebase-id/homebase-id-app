import { useAllContacts } from 'chat-app-common';
import { ActivityIndicator, FlatList, Platform, Text } from 'react-native';
import { ContactTile } from '../components/ui/Contact/Contact-Tile';

import { useCallback, useState } from 'react';
import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { ContactFile } from '@youfoundation/js-lib/network';
import { Header, HeaderBackButtonProps } from '@react-navigation/elements';
import { BackButton } from '../components/ui/home-app-bar';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../app/App';
import { useConversation } from '../hooks/chat/useConversation';
import Dialog from 'react-native-dialog';

export const NewGroupPage = () => {
  const contacts = useAllContacts(true).data;
  const [dialogVisible, setDialogVisible] = useState(false);

  const [selectedContacts, setSetselectedContacts] = useState<
    DriveSearchResult<ContactFile>[]
  >([]);
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, 'NewChat'>>();
  const { mutateAsync: createNew } = useConversation().create;

  let groupTitle: string | undefined;

  const createGroupCallback = useCallback(async () => {
    const { newConversationId } = await createNew({
      recipients: selectedContacts.map(
        contact => contact.fileMetadata.appData.content.odinId as string,
      ),
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
  if (!contacts) return null;

  return (
    <>
      <Header
        title="New Group"
        headerStatusBarHeight={Platform.OS === 'ios' ? 10 : 0}
        headerLeft={(props: HeaderBackButtonProps) => {
          return BackButton({
            onPress: () => navigation.goBack(),
            prop: props,
            label: '',
            style: { marginLeft: 10 },
          });
        }}
        headerRight={() =>
          CreateGroup({
            disabled: selectedContacts.length < 2,
            onPress: async () => {
              if (selectedContacts.length === 0) return;
              setDialogVisible(true);
            },
          })
        }
      />
      <FlatList
        data={contacts}
        keyExtractor={item => item.fileId}
        renderItem={({ item }) => (
          <ContactTile
            item={item}
            selectMode
            isSelected={selectedContacts.includes(item)}
            onPress={() => {
              if (selectedContacts.includes(item)) {
                setSetselectedContacts(
                  selectedContacts.filter(contact => contact !== item),
                );
              } else setSetselectedContacts([...selectedContacts, item]);
            }}
          />
        )}
      />
      <Dialog.Container
        visible={dialogVisible}
        onBackdropPress={() => setDialogVisible(false)}>
        <Dialog.Title>New Group Name</Dialog.Title>
        <Dialog.Input onChangeText={value => (groupTitle = value)} />
        <Dialog.Button
          label="Cancel"
          onPress={() => {
            setDialogVisible(false);
          }}
        />
        <Dialog.Button
          label="Create"
          onPress={async () => await createGroupCallback()}
        />
      </Dialog.Container>
    </>
  );
};

function CreateGroup(props: {
  disabled: boolean;
  // onPress: () => Promise<{ newConversationId: string } | undefined>;
  onPress: () => void;
}) {
  const [loading, setloading] = useState(false);
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, 'NewChat'>>();
  if (loading) {
    return (
      <ActivityIndicator
        style={{
          marginRight: 10,
        }}
        size="small"
        color="black"
      />
    );
  } else {
    return (
      <TouchableOpacity
        disabled={props.disabled}
        onPress={props.onPress}
        // onPress={async () => {
        //   setloading(true);
        //   const newConversationId = await props.onPress();
        //   setloading(false);
        //   if (newConversationId) {
        //     navigation.goBack();
        //     navigation.goBack();
        //     navigation.navigate('ChatScreen', {
        //       convoId: newConversationId.newConversationId,
        //     });
        //   }
        // }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            marginRight: 10,
            color: props.disabled ? 'grey' : 'black',
          }}>
          Create
        </Text>
      </TouchableOpacity>
    );
  }
}
