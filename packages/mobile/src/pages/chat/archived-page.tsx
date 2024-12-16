import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatStackParamList } from '../../app/ChatStack';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import {
  ConversationWithRecentMessage,
  useConversationsWithRecentMessage,
} from '../../hooks/chat/useConversationsWithRecentMessage';
import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary/ErrorBoundary';
import ConversationTile from '../../components/Chat/Conversation-tile';
import { ListRenderItemInfo, View } from 'react-native';
import { useDotYouClientContext } from 'homebase-id-app-common';
import { Text } from '../../components/ui/Text/Text';

type ArchivedPageProp = NativeStackScreenProps<ChatStackParamList, 'Archived'>;

export const ArchivedPage = ({ navigation }: ArchivedPageProp) => {
  const identity = useDotYouClientContext().getLoggedInIdentity();
  const { data: conversations } = useConversationsWithRecentMessage().all;

  const filteredConversations = useMemo(
    () => conversations?.filter((convo) => convo.fileMetadata.appData.archivalStatus === 3),
    [conversations]
  );
  const keyExtractor = useCallback(
    (item: ConversationWithRecentMessage) =>
      item?.fileId || item?.fileMetadata?.appData?.uniqueId || '',
    []
  );

  const onPress = useCallback(
    (convoId: string) => {
      navigation.navigate('ChatScreen', {
        convoId: convoId,
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ConversationWithRecentMessage>) => {
      if (!item) return <View />;
      const hasPayload = item.fileMetadata.payloads?.length > 0;
      return (
        <ErrorBoundary>
          <ConversationTile
            conversation={item.fileMetadata.appData.content}
            conversationId={item.fileMetadata.appData.uniqueId}
            conversationUpdated={item.fileMetadata.updated}
            fileId={item.fileId}
            payloadKey={hasPayload ? item.fileMetadata.payloads[0].key : undefined}
            onPress={onPress}
            odinId={
              item.fileMetadata.appData.content.recipients.filter(
                (recipient) => recipient !== identity
              )[0]
            }
          />
        </ErrorBoundary>
      );
    },
    [identity, onPress]
  );
  return (
    <SafeAreaView>
      <FlatList
        data={filteredConversations}
        showsVerticalScrollIndicator={false}
        keyExtractor={keyExtractor}
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={<EmptyArchivedList />}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

const EmptyArchivedList = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Empty Archived List</Text>
    </View>
  );
};
