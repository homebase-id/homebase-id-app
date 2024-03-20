import { FlatList } from 'react-native';
import ConversationTile from '../components/ui/Chat/Conversation-tile';

import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../app/App';
import { ConversationWithRecentMessage, useConversations } from '../hooks/chat/useConversations';
import {
  ConversationWithYourselfId,
  SingleConversation,
} from '../provider/chat/ConversationProvider';
import { useAuth } from '../hooks/auth/useAuth';
import { useProfile } from '../hooks/profile/useProfile';
import { memo, useMemo } from 'react';

const ConversationPage = memo(() => {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const { data: conversations } = useConversations().all;

  const flatConversations = useMemo(
    () => conversations?.pages?.flatMap((page) => page.searchResults),
    [conversations]
  );

  return (
    <FlatList
      data={flatConversations}
      keyExtractor={(item) => item.fileId}
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
          odinId={(item.fileMetadata.appData.content as SingleConversation).recipient}
        />
      )}
    />
  );
});

const ConversationTileWithYourself = () => {
  const user = useProfile().data;
  const odinId = useAuth().getIdentity();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  if (!user) return null;
  return (
    <ConversationTile
      odinId={odinId || ''}
      conversation={{
        title: `${user?.firstName} ${user?.surName} `,
        recipient: '',
      }}
      conversationId={ConversationWithYourselfId}
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
