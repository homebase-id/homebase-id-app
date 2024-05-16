import { memo, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableHighlight, View } from 'react-native';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { Colors } from '../../app/Colors';
import { Conversation, UnifiedConversation } from '../../provider/chat/ConversationProvider';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatSentTimeIndicator } from './Chat-Sent-Time-Indicator';
import useContact from '../../hooks/contact/useContact';
import { ChatDeliveryIndicator } from './Chat-Delivery-Indicator';
import { ChatMessageContent } from './Chat-Message-Content';
import { OwnerAvatar, GroupAvatar, Avatar } from '../ui/Avatars/Avatar';
import { useDraftMessageValue } from '../../hooks/chat/useDraftMessage';
import { ellipsisAtMaxChar } from 'feed-app-common';
import { ConnectionName } from '../ui/Name';

type ConversationTileProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  conversation: UnifiedConversation;
  odinId: string;
  conversationId?: string;
  isSelf?: boolean;
};

const ConversationTile = memo((props: ConversationTileProps) => {
  const { data: chatMessages } = useChatMessages({
    conversationId: props.conversationId,
  }).all;
  const flatMessages = useMemo(
    () =>
      chatMessages?.pages
        .flatMap((page) => page.searchResults)
        ?.filter(Boolean) as HomebaseFile<ChatMessage>[],
    [chatMessages]
  );
  const { data: draftMessage } = useDraftMessageValue(props.conversationId).get;
  const { isDarkMode } = useDarkMode();
  const { data: contact } = useContact(props.odinId).fetch;
  console.log(props.conversation);
  const connectionDetails = contact?.fileMetadata.appData.content;
  const isGroup = props.conversation && props.conversation.recipients?.length > 2;

  const lastMessage = useMemo(() => flatMessages?.[0], [flatMessages]);
  const lastMessageContent = lastMessage?.fileMetadata.appData.content;

  const lastReadTime = props.conversation.lastReadTime;
  const unreadCount = useMemo(
    () =>
      flatMessages && lastReadTime
        ? flatMessages.filter(
            (msg) => msg.fileMetadata.senderOdinId && msg.fileMetadata.created >= lastReadTime
          ).length
        : 0,
    [flatMessages, lastReadTime]
  );

  const underlayColor = useMemo(
    () => (isDarkMode ? Colors.slate[900] : Colors.slate[100]),
    [isDarkMode]
  );

  return (
    <TouchableHighlight
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      underlayColor={underlayColor}
      style={{
        marginTop: 4,
      }}
    >
      <View style={{ ...styles.tile }}>
        <View style={{ marginRight: 16 }}>
          {!isGroup ? (
            props.isSelf ? (
              <OwnerAvatar />
            ) : (
              <Avatar odinId={props.odinId} />
            )
          ) : (
            <GroupAvatar />
          )}
        </View>

        <View style={styles.content}>
          <Text
            numberOfLines={1}
            style={{
              ...styles.title,
              color: isDarkMode ? Colors.white : Colors.slate[900],
            }}
          >
            {isGroup || props.isSelf
              ? props.conversation.title
              : (connectionDetails?.name?.displayName || connectionDetails?.name?.givenName) ?? (
                  <ConnectionName odinId={props.odinId} />
                )}
            {props.isSelf ? <Text style={styles.you}>(you)</Text> : null}
          </Text>

          {draftMessage ? (
            <DraftMessage message={draftMessage} />
          ) : lastMessage && lastMessageContent ? (
            <View
              style={{
                flexDirection: 'row',
                alignContent: 'flex-start',
              }}
            >
              <ChatDeliveryIndicator msg={lastMessage} />
              <Text
                numberOfLines={1}
                style={[
                  styles.description,
                  {
                    color: isDarkMode ? Colors.white : Colors.slate[900],
                  },
                  lastMessage.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus
                    ? styles.deleted
                    : undefined,
                ]}
              >
                <ChatMessageContent {...lastMessage} />
              </Text>
            </View>
          ) : null}
        </View>
        <View
          style={{
            justifyContent: 'space-between',
            display: 'flex',
          }}
        >
          {lastMessage && <ChatSentTimeIndicator msg={lastMessage} keepDetail={false} />}
          {unreadCount > 0 ? <UnreadCount count={unreadCount} /> : null}
        </View>
      </View>
    </TouchableHighlight>
  );
});

const DraftMessage = ({ message }: { message: string }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Text
      style={{
        ...styles.description,
        fontWeight: '500',
        color: Colors.gray[500],
      }}
    >
      Draft:{' '}
      <Text
        style={{
          color: isDarkMode ? Colors.slate[400] : Colors.slate[700],
          fontWeight: '400',
        }}
      >
        {ellipsisAtMaxChar(message, 30)}
      </Text>
    </Text>
  );
};

const UnreadCount = ({ count }: { count: number }) => {
  const { isDarkMode } = useDarkMode();

  const textStyle = useMemo(
    () =>
      ({
        fontSize: 12,
        textAlign: 'center',
        color: isDarkMode ? Colors.white : Colors.blue[900],
      }) as StyleProp<TextStyle>,
    [isDarkMode]
  );
  return (
    <View
      style={{
        ...styles.unreadStyle,
        backgroundColor: isDarkMode ? Colors.blue[500] : Colors.blue[100],
      }}
    >
      <Text style={textStyle}>
        {Math.min(count, 10)}
        {count >= 10 ? '+' : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    padding: 16,
    flexDirection: 'row',
    borderRadius: 5,
  },
  deleted: {
    textDecorationLine: 'line-through',
    color: Colors.gray[500],
  } as TextStyle,
  content: {
    borderRadius: 8,
    alignSelf: 'center',
    flex: 1,
  },
  you: {
    fontSize: 16,
    color: Colors.slate[500],
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
  },
  unreadStyle: {
    borderRadius: 25,
    padding: 4,
    width: 24,
    height: 24,
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    alignItems: 'center',
  },

  description: {
    fontSize: 16,
    marginVertical: 4,
  },
});

export default ConversationTile;
