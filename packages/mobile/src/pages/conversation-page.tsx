import { FlatList } from 'react-native';
import ConversationTile from '../components/ui/Chat/Conversation-tile';
import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../app/App';
import { useConversations } from '../hooks/chat/useConversations';
import {
  Conversation,
  ConversationWithYourselfId,
  SingleConversation,
} from '../providers/chat/ConversationProvider';
import { useAuth } from '../hooks/auth/useAuth';
import { useProfile } from 'chat-app-common';

const ConversationPage = ({
  navigation,
}: {
  navigation: NavigationProp<RootStackParamList, 'Home'>;
}) => {
  const { data: conversations } = useConversations().all;

  const flatConversations =
    (conversations?.pages
      ?.flatMap(page => page.searchResults)
      ?.filter(Boolean) as DriveSearchResult<Conversation>[]) || [];

  return (
    <FlatList
      data={flatConversations}
      keyExtractor={item => item.fileId}
      ListHeaderComponent={ConversationTileWithYourself}
      renderItem={({ item }) => (
        <ConversationTile
          conversation={item.fileMetadata.appData.content}
          conversationId={item.fileMetadata.appData.uniqueId}
          onPress={() => {
            if (item.fileMetadata.appData.uniqueId) {
              navigation.navigate('ChatScreen', {
                convoId: item.fileMetadata.appData.uniqueId,
              });
            }
          }}
          odinId={
            (item.fileMetadata.appData.content as SingleConversation).recipient
          }
        />
      )}
    />
  );
};

const ConversationTileWithYourself = () => {
  const user = useProfile().data;
  const odinId = useAuth().getIdentity();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <ConversationTile
      odinId={odinId || ''}
      conversation={{
        title: `${user?.firstName} ${user?.surName} `,
        recipient: '',
      }}
      isSelf
      onPress={() =>
        navigation.navigate('ChatScreen', {
          convoId: ConversationWithYourselfId,
        })
      }
    />
  );
};

export default ConversationPage;
