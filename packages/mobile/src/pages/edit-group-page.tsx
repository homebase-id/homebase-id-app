import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AppStackParamList } from '../app/App';
import { useConversation } from '../hooks/chat/useConversation';
import { useCallback, useEffect, useState } from 'react';
import { GroupAvatar } from '../components/ui/Chat/Conversation-tile';
import { Input } from '../components/ui/Form/Input';
import TextButton from '../components/ui/Text/Text-Button';
import { Header, HeaderBackButton } from '@react-navigation/elements';

export type EditGroupProp = NativeStackScreenProps<AppStackParamList, 'EditGroup'>;

function EditGroupPage(props: EditGroupProp) {
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
        sendCommand: true,
      });
    }
  }, [conversation, conversationContent, title, updateGroupConversation]);

  useEffect(() => {
    if (updateStatus === 'success') {
      props.navigation.goBack();
    }
  }, [props.navigation, updateStatus]);

  if (!conversation) return null;

  const headerLeft = () => (
    <HeaderBackButton canGoBack={true} labelVisible={false} onPress={props.navigation.goBack} />
  );
  const headerRight = () => {
    if (title !== conversationContent?.title && title?.length > 0) {
      return <TextButton title="Save" style={{ marginRight: 8 }} onPress={save} />;
    }
    if (updateStatus === 'pending') {
      return <ActivityIndicator size={'small'} style={{ marginRight: 8 }} />;
    }
    return undefined;
  };
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
        <Header title={'Edit Group Title'} headerLeft={headerLeft} headerRight={headerRight} />
      </View>
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
