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
import { useDarkMode } from 'feed-app-common';
import { Users } from '../Icons/icons';

type ConversationTileProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  conversation: Conversation;
  odinId: string;
  conversationId?: string;
  isSelf?: boolean;
};

export const Avatar = (props: {
  odinId: string | null;
  style?: StyleProp<ImageStyle>;
}) => {
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
  iconSize?:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | number;
}) => {
  const darkMode = useDarkMode();
  return (
    <View
      style={[
        styles.tinyLogo,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: darkMode.isDarkMode
            ? Colors.slate[800]
            : Colors.purple[200],
        },
        props.style,
      ]}>
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
        .flatMap(page => page.searchResults)
        ?.filter(Boolean) as DriveSearchResult<ChatMessage>[],
    [data],
  );
  const darkMode = useDarkMode();

  const lastMessage = flatMessages?.[0];
  return (
    <TouchableOpacity onPress={props.onPress} onLongPress={props.onLongPress}>
      <View
        style={[
          styles.tile,
          {
            backgroundColor: darkMode.isDarkMode
              ? Colors.slate[900]
              : Colors.white,
          },
        ]}>
        {'recipient' in props.conversation &&
        props.conversation.recipient !== undefined ? (
          <Avatar odinId={props.odinId} />
        ) : 'recipients' in props.conversation &&
          props.conversation.recipients !== undefined ? (
          <GroupAvatar />
        ) : null}

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: darkMode.isDarkMode ? Colors.white : Colors.slate[900],
              },
            ]}>
            {props.conversation.title}
            {props.isSelf ? <Text style={styles.you}>(you)</Text> : null}
          </Text>

          {lastMessage ? (
            <Text
              style={[
                styles.description,
                {
                  color: darkMode.isDarkMode ? Colors.white : Colors.slate[900],
                },
              ]}>
              {lastMessage.fileMetadata.appData.content.message || '📸 Media'}
            </Text>
          ) : null}
        </View>
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
