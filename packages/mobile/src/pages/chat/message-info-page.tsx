import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../components/ui/Text/Text';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useChatReaction } from '../../hooks/chat/useChatReaction';

import { AuthorName, ConnectionName } from '../../components/ui/Name';
import {
  FailedDeliveryDetails,
  InnerDeliveryIndicator,
} from '../../components/Chat/Chat-Delivery-Indicator';
import { useDotYouClientContext } from 'feed-app-common';
import { ChatStackParamList } from '../../app/ChatStack';
import { Avatar, OwnerAvatar } from '../../components/ui/Avatars/Avatar';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { ReactionFile } from '@youfoundation/js-lib/core';

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

  const identity = useDotYouClientContext().getIdentity();
  const conversationContent = conversation.fileMetadata.appData.content;
  const recipients = conversationContent.recipients.filter(
    (recipient) => recipient && recipient !== identity
  );

  const isAuthor =
    message.fileMetadata.senderOdinId === identity || !message.fileMetadata.senderOdinId;

  const { data: reactions } = useChatReaction({
    messageFileId: message.fileId,
    messageGlobalTransitId: message.fileMetadata.globalTransitId,
  }).get;

  function renderDetails() {
    return (
      <View style={styles.container}>
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
      <View style={styles.container}>
        <Header title="Recipients" />
        {recipients.map((recipient) => {
          return (
            <View
              key={recipient}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignContent: 'center',
                gap: 15,
                marginBottom: 10,
              }}
            >
              <Avatar odinId={recipient} />
              <View style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ ...styles.title, fontSize: 20, flexShrink: 0 }}>
                  <ConnectionName odinId={recipient} />
                </Text>

                {isAuthor ? (
                  <FailedDeliveryDetails
                    msg={message}
                    recipient={recipient}
                    style={{ maxWidth: '80%' }}
                  />
                ) : null}
              </View>

              {isAuthor ? (
                <InnerDeliveryIndicator
                  state={
                    messageContent.deliveryDetails?.[recipient] || messageContent.deliveryStatus
                  }
                  showDefault
                  style={{ marginLeft: 'auto' }}
                />
              ) : null}
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
        {reactions.map((reaction: ReactionFile, index: number) => {
          return (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: 10,
              }}
            >
              <AuthorImage odinId={reaction.authorOdinId} />
              <Text style={{ ...styles.title, fontSize: 20, marginTop: 0 }}>
                <AuthorName odinId={reaction.authorOdinId} />
              </Text>
              <Text style={styles.emoji}>{reaction.body}</Text>
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
  container: {
    paddingHorizontal: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
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
