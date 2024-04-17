import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useConversation } from '../../hooks/chat/useConversation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Input } from '../../components/ui/Form/Input';
import TextButton from '../../components/ui/Text/Text-Button';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { ChatStackParamList } from '../../app/App';
import { GroupAvatar } from '../../components/ui/Avatars/Avatar';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';

export type EditGroupProp = NativeStackScreenProps<ChatStackParamList, 'EditGroup'>;

export function EditGroupPage(props: EditGroupProp) {
  const { convoId: conversationId } = props.route.params;
  const { single: conversationFile } = useConversation({ conversationId });
  const { mutate: updateGroupConversation, status: updateStatus } = useConversation().update;
  const conversation = conversationFile.data;
  const conversationContent = conversation?.fileMetadata.appData.content;
  const [title, setTitle] = useState<string>(conversationContent?.title || '');

  const save = useCallback(() => {
    if (conversationContent && conversation) {
      conversation.fileMetadata.appData.content.title = title as string;
      updateGroupConversation({
        conversation,
        isTitleUpdated: true,
      });
    }
  }, [conversation, conversationContent, title, updateGroupConversation]);

  useEffect(() => {
    if (updateStatus === 'success') {
      props.navigation.goBack();
    }
  }, [props.navigation, updateStatus]);

  const headerLeft = useCallback(
    () => (
      <HeaderBackButton canGoBack={true} labelVisible={false} onPress={props.navigation.goBack} />
    ),
    [props.navigation.goBack]
  );

  const headerRight = useCallback(() => {
    if (title !== conversationContent?.title && title?.length > 0) {
      return <TextButton title="Save" style={{ marginRight: 8 }} onPress={save} />;
    }
    if (updateStatus === 'pending') {
      return <ActivityIndicator size={'small'} style={{ marginRight: 8 }} />;
    }
    return undefined;
  }, [conversationContent?.title, save, title, updateStatus]);

  const { isDarkMode } = useDarkMode();
  const headerColor = useMemo(
    () => (isDarkMode ? Colors.slate[900] : Colors.gray[50]),
    [isDarkMode]
  );

  if (!conversation) return null;

  return (
    <>
      <View
        style={[
          {
            paddingVertical: 3,
            width: '100%',
            zIndex: 10,
          },
        ]}
      >
        <Header
          title={'Edit Group Title'}
          headerLeft={headerLeft}
          headerRight={headerRight}
          headerStyle={{
            backgroundColor: headerColor,
          }}
        />
      </View>
      <SafeAreaView>
        <View style={styles.content}>
          <GroupAvatar style={styles.avatar} iconSize={'2xl'} />
          {/* <TextButton
          title="Edit Avatar"
          onPress={() => {
            //TODO Change Avatar
          }}
        /> */}
          <Input
            value={title}
            onChangeText={(title) => setTitle(title)}
            autoCorrect={false}
            autoFocus={true}
            autoCapitalize="sentences"
            style={{
              width: '70%',
            }}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  avatar: {
    width: 81,
    height: 81,
    borderRadius: 50,
    margin: 16,
    marginRight: 0,
  },
});

export default EditGroupPage;
