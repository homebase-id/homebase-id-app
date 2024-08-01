import { useAllConnections } from 'feed-app-common';
import { FlatList, ListRenderItemInfo, Platform, StatusBar, Text } from 'react-native';
import { ContactTile } from '../../components/Contact/Contact-Tile';

import { memo, useCallback, useMemo, useState } from 'react';
import { Header, HeaderBackButtonProps } from '@react-navigation/elements';
import { BackButton } from '../../components/ui/Buttons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList, NewChatStackParamList } from '../../app/ChatStack';
import { useConversation } from '../../hooks/chat/useConversation';
import Dialog from 'react-native-dialog';
import { DotYouProfile } from '@youfoundation/js-lib/network';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';

export const NewGroupPage = memo(
  ({ navigation }: { navigation: NavigationProp<NewChatStackParamList, 'NewGroup'> }) => {
    const contacts = useAllConnections(true).data;
    const [dialogVisible, setDialogVisible] = useState(false);

    const [selectedContacts, setSetselectedContacts] = useState<DotYouProfile[]>([]);
    const nav = useNavigation<NavigationProp<ChatStackParamList>>();

    const { mutateAsync: createNew } = useConversation().create;

    const [groupTitle, setgroupTitle] = useState<string>();

    const createGroupCallback = useCallback(async () => {
      const conversation = await createNew({
        recipients: selectedContacts.map((contact) => contact.odinId as string),
        title: groupTitle,
      });
      if (conversation) {
        setDialogVisible(false);
        navigation.goBack();
        navigation.goBack();
        setTimeout(() => {
          nav.navigate('ChatScreen', {
            convoId: conversation.fileMetadata.appData.uniqueId as string,
          });
        }, 100);
      }
    }, [createNew, selectedContacts, groupTitle, navigation, nav]);

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

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<DotYouProfile>) => (
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
      ),
      [selectedContacts]
    );
    const { isDarkMode } = useDarkMode();
    const headerStyle = useMemo(() => {
      return {
        backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
      };
    }, [isDarkMode]);

    if (!contacts) return null;

    return (
      <>
        <Header
          title="New Group"
          headerStatusBarHeight={Platform.OS === 'ios' ? 10 : 0}
          headerLeft={headerLeft}
          headerRight={headerRight}
          headerStyle={headerStyle}
        />
        <SafeAreaView>
          {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
          <FlatList data={contacts} keyExtractor={(item) => item.odinId} renderItem={renderItem} />
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
        </SafeAreaView>
      </>
    );
  }
);

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
