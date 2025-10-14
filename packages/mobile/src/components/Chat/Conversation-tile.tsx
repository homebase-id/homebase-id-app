import { memo, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';
import { EmbeddedThumb, HomebaseFile } from '@homebase-id/js-lib/core';
import { Colors } from '../../app/Colors';
import { ChatDrive, UnifiedConversation } from '../../provider/chat/ConversationProvider';
import { useChatMessages } from '../../hooks/chat/useChatMessages';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatSentTimeIndicator } from './Chat-Sent-Time-Indicator';
import useContact from '../../hooks/contact/useContact';
import { ChatDeliveryIndicator } from './Chat-Delivery-Indicator';
import { ChatMessageContent } from './Chat-Message-Content';
import { OwnerAvatar, GroupAvatar, Avatar } from '../ui/Avatars/Avatar';
import { useDraftMessageValue } from '../../hooks/chat/useDraftMessage';
import { ellipsisAtMaxChar, useDotYouClientContext } from 'homebase-id-app-common';
import { AuthorName, ConnectionName } from '../ui/Name';
import { CheckCircle, CircleOutlined } from '../ui/Icons/icons';
import { ErrorBoundary } from '../ui/ErrorBoundary/ErrorBoundary';
import { useConversationMetadata } from '../../hooks/chat/useConversationMetadata';

type ConversationTileProps = {
  onPress?: (conversationId: string) => void;
  onLongPress?: () => void;
  conversation: UnifiedConversation;
  fileId?: string;
  payloadKey?: string;
  previewThumbnail?: EmbeddedThumb;
  conversationUpdated: number; //TODO: Maybe useHooks instead of passing prop?
  odinId: string;
  conversationId?: string;
  selectMode?: boolean;
  isSelected?: boolean;
  isSelf?: boolean;
  style?: ViewStyle;
};

const ConversationTile = memo((props: ConversationTileProps) => {
  const identity = useDotYouClientContext().getLoggedInIdentity();
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
  const isGroup = props.conversation && props.conversation.recipients?.length > 2;
  const { data: contact } = useContact(!isGroup ? props.odinId : undefined).fetch;
  const connectionDetails = contact?.fileMetadata.appData.content;

  const lastMessage = useMemo(() => flatMessages?.[0], [flatMessages]);
  const lastMessageContent = lastMessage?.fileMetadata.appData.content;
  const lastMessageAuthor =
    lastMessage?.fileMetadata.senderOdinId || lastMessage?.fileMetadata.originalAuthor;
  const { data: conversationMetadata } = useConversationMetadata({
    conversationId: props.conversationId,
  }).single;
  const lastReadTime = conversationMetadata?.fileMetadata?.localAppData?.content?.lastReadTime;
  const unreadCount = useMemo(
    () =>
      lastReadTime &&
      flatMessages &&
      lastMessage?.fileMetadata.senderOdinId &&
      lastMessage?.fileMetadata.senderOdinId !== identity
        ? flatMessages.filter(
            (msg) =>
              msg.fileMetadata.senderOdinId !== identity &&
              (msg.fileMetadata.transitCreated || msg.fileMetadata.created) > lastReadTime
          )?.length
        : 0,
    [flatMessages, lastMessage, lastReadTime, identity]
  );

  const underlayColor = useMemo(
    () => (isDarkMode ? Colors.slate[800] : Colors.slate[100]),
    [isDarkMode]
  );

  return (
    <ErrorBoundary>
      <TouchableHighlight
        onPress={() => props.onPress?.(props.conversationId as string)}
        onLongPress={props.onLongPress}
        underlayColor={underlayColor}
        style={styles.touchable}
      >
        <View style={[styles.tile, props.style]}>
          <View style={styles.avatarContainer}>
            {!isGroup ? (
              props.isSelf ? (
                <OwnerAvatar />
              ) : (
                <Avatar odinId={props.odinId} />
              )
            ) : (
              <GroupAvatar
                fileId={props.fileId}
                targetDrive={ChatDrive}
                fileKey={props.payloadKey}
                previewThumbnail={props.previewThumbnail}
              />
            )}
          </View>
          <View style={styles.content}>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: isDarkMode ? Colors.white : Colors.slate[900] }]}
            >
              {isGroup || props.isSelf
                ? props.conversation.title.trim()
                : ((connectionDetails?.name?.displayName || connectionDetails?.name?.givenName) ?? (
                    <ConnectionName odinId={props.odinId} />
                  ))}
              {props.isSelf ? <Text style={styles.you}> (you)</Text> : null}
            </Text>

            {props.selectMode ? null : draftMessage ? (
              <DraftMessage message={draftMessage} />
            ) : lastMessage && lastMessageContent ? (
              <View style={styles.messageContainer}>
                <ChatDeliveryIndicator msg={lastMessage} showDefaultColor />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.description,
                    styles.descriptionFlex,
                    { color: isDarkMode ? Colors.white : Colors.slate[900] },
                  ]}
                >
                  {isGroup ? (
                    <Text
                      style={[
                        styles.authorName,
                        { color: isDarkMode ? Colors.indigo[400] : Colors.indigo[700] },
                      ]}
                    >
                      <AuthorName odinId={lastMessageAuthor} showYou showFirstNameOnly />
                      {': '}
                    </Text>
                  ) : null}
                  <Text
                    style={
                      lastMessage.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus
                        ? styles.deleted
                        : undefined
                    }
                  >
                    <ChatMessageContent {...lastMessage} />
                  </Text>
                </Text>
              </View>
            ) : null}
          </View>
          {props.selectMode ? (
            <View style={styles.selectModeIcon}>
              {props.isSelected ? <CheckCircle size={'lg'} /> : <CircleOutlined size={'lg'} />}
            </View>
          ) : (
            <View style={styles.timeContainer}>
              {
                <ChatSentTimeIndicator
                  msg={lastMessage}
                  keepDetail={false}
                  conversationLastUpdated={props.conversationUpdated}
                />
              }
              {unreadCount > 0 ? <UnreadCount count={unreadCount} /> : null}
            </View>
          )}
        </View>
      </TouchableHighlight>
    </ErrorBoundary>
  );
});

const DraftMessage = ({ message }: { message: string }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Text style={[styles.description, styles.draftLabel]}>
      Draft:{' '}
      <Text
        style={[
          styles.draftMessage,
          { color: isDarkMode ? Colors.slate[400] : Colors.slate[700] },
        ]}
      >
        {ellipsisAtMaxChar(message, 30)}
      </Text>
    </Text>
  );
};

const UnreadCount = ({ count }: { count: number }) => {
  const { isDarkMode } = useDarkMode();

  return (
    <View
      style={[
        styles.unreadStyle,
        { backgroundColor: isDarkMode ? Colors.blue[500] : Colors.blue[100] },
      ]}
    >
      <Text style={[styles.unreadText, { color: isDarkMode ? Colors.white : Colors.blue[900] }]}>
        {Math.min(count, 10)}
        {count >= 10 ? '+' : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginTop: 4,
  },
  tile: {
    padding: 16,
    flexDirection: 'row',
    borderRadius: 5,
  },
  avatarContainer: {
    marginRight: 16,
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
  messageContainer: {
    flexDirection: 'row',
    alignContent: 'flex-start',
  },
  description: {
    fontSize: 16,
    marginVertical: 4,
  },
  descriptionFlex: {
    flex: 1,
  },
  authorName: {
    fontWeight: '500',
  },
  selectModeIcon: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  timeContainer: {
    justifyContent: 'space-between',
    display: 'flex',
  },
  draftLabel: {
    fontWeight: '500',
    color: Colors.gray[500],
  },
  draftMessage: {
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
  unreadText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ConversationTile;
