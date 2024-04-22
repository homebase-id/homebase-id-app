import { memo, useMemo } from 'react';
import { StyleSheet, Text, TextStyle, TouchableHighlight, View } from 'react-native';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { Colors } from '../../app/Colors';
import { Conversation } from '../../provider/chat/ConversationProvider';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatSentTimeIndicator } from './Chat-Sent-Time-Indicator';
import useContact from '../../hooks/contact/useContact';
import { ChatDeliveryIndicator } from './Chat-Delivery-Indicator';
import { ChatMessageContent } from './Chat-Message-Content';
import { OwnerAvatar, GroupAvatar, Avatar } from '../ui/Avatars/Avatar';

type ConversationTileProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  conversation: Conversation;
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
  const { isDarkMode } = useDarkMode();
  const { data: connection } = useContact(props.odinId).fetch;

  const connectionDetails = connection?.fileMetadata.appData.content;
  const isGroup = 'recipients' in props.conversation && props.conversation.recipients !== undefined;

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

  const colorMode = useMemo(() => (isDarkMode ? Colors.white : Colors.slate[900]), [isDarkMode]);
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
              color: colorMode,
            }}
          >
            {isGroup || props.isSelf
              ? props.conversation.title
              : (connectionDetails?.name?.displayName || connectionDetails?.name?.givenName) ??
                props.odinId}
            {props.isSelf ? <Text style={styles.you}>(you)</Text> : null}
          </Text>

          {lastMessage && lastMessageContent ? (
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
                    color: colorMode,
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

const UnreadCount = ({ count }: { count: number }) => {
  const { isDarkMode } = useDarkMode();
  const bgColor = useMemo(() => (isDarkMode ? Colors.blue[500] : Colors.blue[100]), [isDarkMode]);
  const textColor = useMemo(() => (isDarkMode ? Colors.white : Colors.blue[900]), [isDarkMode]);
  return (
    <View
      style={{
        ...styles.unreadStyle,
        backgroundColor: bgColor,
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: 12,
          textAlign: 'center',
        }}
      >
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
    fontWeight: '500',
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
