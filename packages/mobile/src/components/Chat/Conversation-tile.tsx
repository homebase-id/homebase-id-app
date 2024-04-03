import { memo, useMemo } from 'react';
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { HomebaseFile } from '@youfoundation/js-lib/core';

import { Colors } from '../../app/Colors';
import { Conversation } from '../../provider/chat/ConversationProvider';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { Users } from '../ui/Icons/icons';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatSentTimeIndicator } from './Chat-Sent-Time-Indicator';
import useContact from '../../hooks/contact/useContact';
import { OdinImage } from '../ui/OdinImage/OdinImage';
import { CONTACT_PROFILE_IMAGE_KEY, ContactConfig } from '@youfoundation/js-lib/network';
import { useProfile } from '../../hooks/profile/useProfile';
import { BuiltInProfiles, GetTargetDriveFromProfileId } from '@youfoundation/js-lib/profile';
import { ChatDeliveryIndicator } from './Chat-Delivery-Indicator';
import { ChatMessageContent } from './Chat-Message-Content';

type ConversationTileProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  conversation: Conversation;
  odinId: string;
  conversationId?: string;
  isSelf?: boolean;
};

export const Avatar = (props: {
  odinId: string;
  style?: ImageStyle;
  imageSize?: { width: number; height: number };
}) => {
  const contact = useContact(props.odinId).fetch.data;
  return (
    <OdinImage
      fileId={contact?.fileId}
      fileKey={CONTACT_PROFILE_IMAGE_KEY}
      targetDrive={ContactConfig.ContactTargetDrive}
      imageSize={props.imageSize || { width: 48, height: 48 }}
      avoidPayload={true}
      enableZoom={false}
      fit="cover"
      odinId={props.odinId}
      style={{
        ...styles.tinyLogo,
        ...props.style,
      }}
      lastModified={contact?.fileMetadata.updated}
    />
  );
};

export const OwnerAvatar = (props: {
  style?: ImageStyle;
  imageSize?: { width: number; height: number };
}) => {
  const profile = useProfile().data;
  return (
    <OdinImage
      fit="cover"
      targetDrive={GetTargetDriveFromProfileId(BuiltInProfiles.StandardProfileId)}
      fileId={profile?.profileImageFileId}
      fileKey={profile?.profileImageFileKey}
      avoidPayload={true}
      enableZoom={false}
      imageSize={props.imageSize || { width: 48, height: 48 }}
      style={{
        ...styles.tinyLogo,
        ...props.style,
      }}
    />
  );
};

export const GroupAvatar = (props: {
  style?: StyleProp<ViewStyle>;
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | number;
}) => {
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={[
        styles.tinyLogo,
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? Colors.slate[800] : Colors.purple[200],
        },
        props.style,
      ]}
    >
      <Users size={props.iconSize} />
    </View>
  );
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

  return (
    <TouchableOpacity onPress={props.onPress} onLongPress={props.onLongPress}>
      <View
        style={[
          styles.tile,
          {
            backgroundColor: isDarkMode ? Colors.slate[900] : Colors.white,
          },
        ]}
      >
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

        <View
          style={{
            ...styles.content,
            flex: 1,
          }}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: isDarkMode ? Colors.white : Colors.slate[900],
              },
            ]}
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
                    color: isDarkMode ? Colors.white : Colors.slate[900],
                  },
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
          {unreadCount > 0 ? (
            <View
              style={{
                backgroundColor: isDarkMode ? Colors.blue[500] : Colors.blue[100],
                borderRadius: 8,
                padding: 4,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: isDarkMode ? Colors.white : Colors.blue[900],
                  fontSize: 12,
                }}
              >
                {unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

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
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  description: {
    fontSize: 16,
    marginVertical: 4,
  },
});

export default ConversationTile;
