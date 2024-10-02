import { t, useAllConnections } from 'homebase-id-app-common';
import { FlatList, ListRenderItemInfo, Platform, StatusBar, Text } from 'react-native';
import { ContactTile } from '../../components/Contact/Contact-Tile';

import { memo, useCallback, useMemo, useState } from 'react';
import { Header, HeaderBackButtonProps } from '@react-navigation/elements';
import { BackButton } from '../../components/ui/Buttons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { NavigationProp } from '@react-navigation/native';
import { NewChatStackParamList } from '../../app/ChatStack';

import { DotYouProfile } from '@homebase-id/js-lib/network';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { NoContacts } from '../../components/Contact/NoContacts';

export const NewGroupPage = memo(
  ({ navigation }: { navigation: NavigationProp<NewChatStackParamList, 'NewGroup'> }) => {
    const contacts = useAllConnections(true).data;

    const [selectedContacts, setSetselectedContacts] = useState<DotYouProfile[]>([]);

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
            navigation.navigate('CreateGroup', {
              recipients: selectedContacts,
            });
          },
        }),
      [navigation, selectedContacts]
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
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.odinId}
            renderItem={renderItem}
            ListEmptyComponent={<NoContacts />}
          />
          {/* <Dialog.Container visible={dialogVisible} onBackdropPress={() => setDialogVisible(false)}>
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
          </Dialog.Container> */}
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
        {t('Next')}
      </Text>
    </TouchableOpacity>
  );
}
