import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/ui/Text/Text';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useChatReaction } from '../../hooks/chat/useChatReaction';

import { GroupConversation, SingleConversation } from '../../provider/chat/ConversationProvider';
import { AuthorName, ConnectionName } from '../../components/ui/Name';
import { InnerDeliveryIndicator } from '../../components/Chat/Chat-Delivery-Indicator';
import { useDotYouClientContext } from 'feed-app-common';
import { ChatStackParamList } from '../../app/ChatStack';
import { Avatar, OwnerAvatar } from '../../components/ui/Avatars/Avatar';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';

export type MessageInfoProp = NativeStackScreenProps<ChatStackParamList, 'MessageInfo'>;

const dateTimeFormat: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};

export const MessageInfoPage = ({ route }: MessageInfoProp) => {
  const { message, conversation } = route.params;
  const messageContent = message.fileMetadata.appData.content;

  const conversationContent = conversation.fileMetadata.appData.content;
  const recipients =
    (conversationContent as GroupConversation).recipients ||
    [(conversationContent as SingleConversation).recipient].filter(Boolean);

  const { data: reactions } = useChatReaction({
    conversationId: message.fileMetadata.appData.groupId,
    messageId: message.fileMetadata.appData.uniqueId,
  }).get;

  function renderDetails() {
    return (
      <View>
        <Header title="Details" />
        <Text style={styles.title}>
          Sent:{' '}
          <Text style={styles.content}>
            {new Date(message.fileMetadata.created).toLocaleDateString(undefined, dateTimeFormat)}
          </Text>
        </Text>
        <Text style={styles.title}>
          Updated:{' '}
          <Text style={styles.content}>
            {new Date(message.fileMetadata.updated).toLocaleDateString(undefined, dateTimeFormat)}
          </Text>
        </Text>
        {message.fileMetadata.transitCreated ? (
          <Text style={styles.title}>
            Received:{' '}
            <Text style={styles.content}>
              {new Date(message.fileMetadata.transitCreated).toLocaleDateString(
                undefined,
                dateTimeFormat
              )}
            </Text>
          </Text>
        ) : null}
      </View>
    );
  }
  function renderRecipients() {
    if (!recipients.length) return null;
    return (
      <View>
        <Header title="Recipients" />
        {recipients.map((recipient) => {
          return (
            <View
              key={recipient}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 10,
                alignContent: 'center',
              }}
            >
              <Avatar odinId={recipient} />
              <Text style={{ ...styles.title, fontSize: 20, marginTop: 0 }}>
                <ConnectionName odinId={recipient} />
              </Text>
              <InnerDeliveryIndicator
                state={messageContent.deliveryDetails?.[recipient] || messageContent.deliveryStatus}
              />
            </View>
          );
        })}
      </View>
    );
  }

  function renderReactions() {
    if (!reactions || reactions.length === 0) return null;
    return (
      <View>
        <Header title="Reactions" />
        {reactions.map((reaction) => {
          return (
            <View
              key={reaction.fileId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: 10,
              }}
            >
              <AuthorImage odinId={reaction.fileMetadata.senderOdinId} />
              <Text style={{ ...styles.title, fontSize: 20, marginTop: 0 }}>
                <AuthorName odinId={reaction.fileMetadata.senderOdinId} />
              </Text>
              <Text style={styles.emoji}>{reaction.fileMetadata.appData.content.message}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView>
        {renderDetails()}
        {renderRecipients()}
        {renderReactions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 22,
    fontWeight: '600',
    margin: 10,
  },
  title: {
    fontSize: 18,
    marginTop: 2,
    marginLeft: 10,
    flex: 1,
    alignContent: 'center',
  },
  content: {
    fontSize: 16,
    fontWeight: '500',
  },
  emoji: {
    fontSize: 24,
  },
});

const Header = ({ title }: { title: string }) => {
  return <Text style={styles.header}>{title}</Text>;
};

const AuthorImage = ({ odinId }: { odinId: string }) => {
  const identity = useDotYouClientContext().getIdentity();
  const isSelf = !odinId || identity === odinId;

  if (isSelf) return <OwnerAvatar />;
  return <Avatar odinId={odinId} />;
};
