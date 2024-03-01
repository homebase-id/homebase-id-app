import { useMemo } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { DriveSearchResult } from '@youfoundation/js-lib/core';

import { Colors } from '../../../app/Colors';
import { Conversation } from '../../../provider/chat/ConversationProvider';
import { useChatMessages } from '../../../hooks/chat/useChatMessages';
import { ChatMessage } from '../../../provider/chat/ChatProvider';
import { Users } from '../Icons/icons';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { useExternalOdinId } from '../../../hooks/connections/useExternalOdinId';
import { ellipsisAtMaxChar } from 'feed-app-common';
import { ChatSentTimeIndicator } from './Chat-Sent-Time-Indicator';

type ConversationTileProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  conversation: Conversation;
  odinId: string;
  conversationId?: string;
  isSelf?: boolean;
};

export const Avatar = (props: { odinId: string | null; style?: StyleProp<ImageStyle> }) => {
  return (
    <Image
      source={{
        uri: `https://${props.odinId}/pub/image`,
      }}
      style={[styles.tinyLogo, props.style]}
    />
  );
};

export const GroupAvatar = (props: {
  style?: StyleProp<ViewStyle>;
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | number;
}) => {
  const darkMode = useDarkMode();
  return (
    <View
      style={[
        styles.tinyLogo,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: darkMode.isDarkMode ? Colors.slate[800] : Colors.purple[200],
        },
        props.style,
      ]}
    >
      <Users size={props.iconSize} />
    </View>
  );
};

const ConversationTile = (props: ConversationTileProps) => {
  const { data, isFetched: fetchedMessages } = useChatMessages({
    conversationId: props.conversationId,
  }).all;
  const flatMessages = useMemo(
    () =>
      data?.pages
        .flatMap((page) => page.searchResults)
        ?.filter(Boolean) as DriveSearchResult<ChatMessage>[],
    [data]
  );
  const darkMode = useDarkMode();
  const { data: connectionDetails } = useExternalOdinId({
    odinId: props.odinId,
  }).fetch;

  const isGroup = 'recipients' in props.conversation && props.conversation.recipients !== undefined;

  const lastMessage = flatMessages?.[0];

  // const lastReadTime = props.conversation.lastReadTime;
  // const unreadCount =
  //   flatMessages && lastReadTime
  //     ? flatMessages.filter(
  //         (msg) => msg.fileMetadata.senderOdinId && msg.fileMetadata.created >= lastReadTime
  //       ).length
  //     : 0;

  const lastMessageContent = lastMessage?.fileMetadata.appData.content;

  return (
    <TouchableOpacity onPress={props.onPress} onLongPress={props.onLongPress}>
      <View
        style={[
          styles.tile,
          {
            backgroundColor: darkMode.isDarkMode ? Colors.slate[900] : Colors.white,
          },
        ]}
      >
        {!isGroup ? <Avatar odinId={props.odinId} /> : <GroupAvatar />}

        <View
          style={{
            ...styles.content,
            flex: 1,
          }}
        >
          <Text
            style={[
              styles.title,
              {
                color: darkMode.isDarkMode ? Colors.white : Colors.slate[900],
              },
            ]}
          >
            {isGroup || props.isSelf
              ? props.conversation.title
              : connectionDetails?.name ?? props.odinId}
            {props.isSelf ? <Text style={styles.you}>(you)</Text> : null}
          </Text>

          {lastMessage && lastMessageContent ? (
            <Text
              numberOfLines={1}
              style={[
                styles.description,
                {
                  color: darkMode.isDarkMode ? Colors.white : Colors.slate[900],
                },
              ]}
            >
              {lastMessageContent.message
                ? ellipsisAtMaxChar(lastMessageContent.message, 30)
                : '📸 Media'}
            </Text>
          ) : null}
        </View>
        <View>{lastMessage && <ChatSentTimeIndicator msg={lastMessage} keepDetail={false} />}</View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    padding: 16,
    marginTop: 4,
    flexDirection: 'row',
    borderRadius: 5,
  },
  content: {
    borderRadius: 8,
    alignSelf: 'center',
  },
  you: {
    fontSize: 16,
    color: Colors.slate[500],
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  tinyLogo: {
    objectFit: 'cover',
    marginLeft: 0,
    marginRight: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  description: {
    fontSize: 16,
    marginVertical: 4,
  },
});

export default ConversationTile;
