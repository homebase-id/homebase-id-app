import { InfiniteData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HomebaseFile,
  ReceivedCommand,
  TypedConnectionNotification,
  getCommands,
  markCommandComplete,
} from '@youfoundation/js-lib/core';

import { processInbox } from '@youfoundation/js-lib/peer';

import { useNotificationSubscriber } from '../useNotificationSubscriber';
import { useCallback, useEffect, useRef } from 'react';

import { stringGuidsEqual, tryJsonParse } from '@youfoundation/js-lib/helpers';
import { getSingleConversation, useConversation } from './useConversation';
import { processCommand } from '../../provider/chat/ChatCommandProvider';
import { useDotYouClientContext } from 'feed-app-common';
import {
  ChatMessage,
  ChatMessageFileType,
  MARK_CHAT_READ_COMMAND,
  dsrToMessage,
} from '../../provider/chat/ChatProvider';
import { useAuth } from '../auth/useAuth';
import {
  ChatDrive,
  Conversation,
  ConversationFileType,
  GroupConversationFileType,
  JOIN_CONVERSATION_COMMAND,
  JOIN_GROUP_CONVERSATION_COMMAND,
  UPDATE_GROUP_CONVERSATION_COMMAND,
  dsrToConversation,
} from '../../provider/chat/ConversationProvider';
import { ChatReactionFileType } from '../../provider/chat/ChatReactionProvider';

const MINUTE_IN_MS = 60000;

// We first process the inbox, then we connect for live updates;
export const useLiveChatProcessor = () => {
  // Process the inbox on startup; As we want to cover the backlog of messages first
  const { status: inboxStatus } = useInboxProcessor(true);

  // Only after the inbox is processed, we connect for live updates; So we avoid clearing the cache on each fileAdded update
  const isOnline = useChatWebsocket(inboxStatus === 'success');

  // Only after the inbox is processed, we process commands as new ones might have been added via the inbox
  useChatCommandProcessor(inboxStatus === 'success');

  return isOnline;
};

// Process the inbox on startup
const useInboxProcessor = (connected?: boolean) => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const fetchData = async () => {
    const processedresult = await processInbox(dotYouClient, ChatDrive, 2000);
    // We don't know how many messages we have processed, so we can only invalidate the entire chat query
    queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    return processedresult;
  };

  return useQuery({
    queryKey: ['processInbox'],
    queryFn: fetchData,
    refetchOnMount: false,
    // We want to refetch on window focus, as we might have missed some messages while the window was not focused and the websocket might have lost connection
    refetchOnWindowFocus: true,
    staleTime: MINUTE_IN_MS * 5,
    enabled: connected,
  });
};

const isDebug = false;

const useChatWebsocket = (isEnabled: boolean) => {
  const identity = useDotYouClientContext().getIdentity();
  const dotYouClient = useDotYouClientContext();

  // Added to ensure we have the conversation query available
  const {
    restoreChat: { mutate: restoreChat },
  } = useConversation();
  const queryClient = useQueryClient();

  const handler = useCallback(
    async (notification: TypedConnectionNotification) => {
      isDebug && console.debug('[ChatWebsocket] Got notification', notification);

      if (
        (notification.notificationType === 'fileAdded' ||
          notification.notificationType === 'fileModified') &&
        stringGuidsEqual(notification.targetDrive?.alias, ChatDrive.alias) &&
        stringGuidsEqual(notification.targetDrive?.type, ChatDrive.type)
      ) {
        if (notification.header.fileMetadata.appData.fileType === ChatMessageFileType) {
          const conversationId = notification.header.fileMetadata.appData.groupId;
          const isNewFile = notification.notificationType === 'fileAdded';
          const sender = notification.header.fileMetadata.senderOdinId;

          if (!sender || sender === identity) {
            // Ignore messages sent by the current user
            return;
          }

          if (isNewFile) {
            // Check if the message is orphaned from a conversation
            const conversation = await queryClient.fetchQuery<HomebaseFile<Conversation> | null>({
              queryKey: ['conversation', conversationId],
              queryFn: () => getSingleConversation(dotYouClient, conversationId),
            });

            if (!conversation) {
              console.error('Orphaned message received', notification.header.fileId, conversation);
              // Can't handle this one ATM.. How to resolve?
            } else if (conversation.fileMetadata.appData.archivalStatus === 2) {
              restoreChat({ conversation });
            }
          }

          // This skips the invalidation of all chat messages, as we only need to add/update this specific message
          const updatedChatMessage = await dsrToMessage(
            dotYouClient,
            notification.header,
            ChatDrive,
            true
          );
          if (
            !updatedChatMessage ||
            Object.keys(updatedChatMessage.fileMetadata.appData.content).length === 0
          ) {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
            return;
          }

          const extistingMessages = queryClient.getQueryData<
            InfiniteData<{
              searchResults: (HomebaseFile<ChatMessage> | null)[];
              cursorState: string;
              queryTime: number;
              includeMetadataHeader: boolean;
            }>
          >(['chat-messages', conversationId]);

          if (extistingMessages) {
            const newData = {
              ...extistingMessages,
              pages: extistingMessages?.pages?.map((page, index) => ({
                ...page,
                searchResults: isNewFile
                  ? index === 0
                    ? [
                        updatedChatMessage,
                        // There shouldn't be any duplicates, but just in case
                        ...page.searchResults.filter(
                          (msg) => !stringGuidsEqual(msg?.fileId, updatedChatMessage.fileId)
                        ),
                      ]
                    : page.searchResults.filter(
                        (msg) => !stringGuidsEqual(msg?.fileId, updatedChatMessage.fileId)
                      ) // There shouldn't be any duplicates, but just in case
                  : page.searchResults.map((msg) =>
                      stringGuidsEqual(msg?.fileId, updatedChatMessage.fileId)
                        ? updatedChatMessage
                        : msg
                    ),
              })),
            };
            queryClient.setQueryData(['chat-messages', conversationId], newData);
          }

          queryClient.setQueryData(
            ['chat-message', updatedChatMessage.fileMetadata.appData.uniqueId],
            updatedChatMessage
          );
        } else if (notification.header.fileMetadata.appData.fileType === ChatReactionFileType) {
          const messageId = notification.header.fileMetadata.appData.groupId;
          queryClient.invalidateQueries({ queryKey: ['chat-reaction', messageId] });
        } else if (
          notification.header.fileMetadata.appData.fileType === ConversationFileType ||
          notification.header.fileMetadata.appData.fileType === GroupConversationFileType
        ) {
          const isNewFile = notification.notificationType === 'fileAdded';

          const updatedConversation = await dsrToConversation(
            dotYouClient,
            notification.header,
            ChatDrive,
            true
          );

          if (
            !updatedConversation ||
            Object.keys(updatedConversation.fileMetadata.appData.content).length === 0
          ) {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            return;
          }

          const extistingConversations = queryClient.getQueryData<
            InfiniteData<{
              searchResults: HomebaseFile<Conversation>[];
              cursorState: string;
              queryTime: number;
              includeMetadataHeader: boolean;
            }>
          >(['conversations']);

          if (extistingConversations) {
            const newData = {
              ...extistingConversations,
              pages: extistingConversations.pages.map((page, index) => ({
                ...page,
                searchResults: isNewFile
                  ? index === 0
                    ? [
                        updatedConversation,
                        // There shouldn't be any duplicates for a fileAdded, but just in case
                        ...page.searchResults.filter(
                          (msg) => !stringGuidsEqual(msg?.fileId, updatedConversation.fileId)
                        ),
                      ]
                    : page.searchResults.filter(
                        (msg) => !stringGuidsEqual(msg?.fileId, updatedConversation.fileId)
                      ) // There shouldn't be any duplicates for a fileAdded, but just in case
                  : page.searchResults.map((conversation) =>
                      stringGuidsEqual(
                        conversation.fileMetadata.appData.uniqueId,
                        updatedConversation.fileMetadata.appData.uniqueId
                      )
                        ? updatedConversation
                        : conversation
                    ),
              })),
            };
            queryClient.setQueryData(['conversations'], newData);
          }
        } else if (
          [
            JOIN_CONVERSATION_COMMAND,
            JOIN_GROUP_CONVERSATION_COMMAND,
            MARK_CHAT_READ_COMMAND,
            UPDATE_GROUP_CONVERSATION_COMMAND,
          ].includes(notification.header.fileMetadata.appData.dataType) &&
          identity
        ) {
          const command: ReceivedCommand = tryJsonParse<ReceivedCommand>(
            notification.header.fileMetadata.appData.content
          );
          command.sender = notification.header.fileMetadata.senderOdinId;
          command.clientCode = notification.header.fileMetadata.appData.dataType;
          command.id = notification.header.fileId;

          const processedCommand = await processCommand(
            dotYouClient,
            queryClient,
            command,
            identity
          );
          if (processedCommand) {
            await markCommandComplete(dotYouClient, ChatDrive, [processedCommand]);
          }
        }
        // TODO: Should we handle updates to conversations? Probabaly mostly if there's multiple clients connected
      }
    },
    [dotYouClient, identity, queryClient, restoreChat]
  );

  return useNotificationSubscriber(
    isEnabled ? handler : undefined,
    ['fileAdded', 'fileModified'],
    [ChatDrive],
    () => {
      queryClient.invalidateQueries({ queryKey: ['processInbox'] });
    }
  );
};

const useChatCommandProcessor = (isEnabled?: boolean) => {
  const { getIdentity } = useAuth();
  const dotYouClient = useDotYouClientContext();
  const identity = getIdentity();
  const queryClient = useQueryClient();

  const isProcessing = useRef(false);

  useEffect(() => {
    if (!isEnabled) return;

    (async () => {
      if (!identity) return;
      if (isProcessing.current) return;
      isProcessing.current = true;
      const commands = await getCommands(dotYouClient, ChatDrive);
      const filteredCommands = commands.receivedCommands.filter(
        (command) =>
          command.clientCode === JOIN_CONVERSATION_COMMAND ||
          command.clientCode === MARK_CHAT_READ_COMMAND ||
          command.clientCode === JOIN_GROUP_CONVERSATION_COMMAND ||
          command.clientCode === UPDATE_GROUP_CONVERSATION_COMMAND
      );

      const completedCommands: string[] = [];
      // Can't use Promise.all, as we need to wait for the previous command to complete as commands can target the same conversation
      for (let i = 0; i < filteredCommands.length; i++) {
        const command = filteredCommands[i];

        const completedCommand = await processCommand(dotYouClient, queryClient, command, identity);
        if (completedCommand) completedCommands.push(completedCommand);
      }

      if (completedCommands.length > 0) {
        await markCommandComplete(
          dotYouClient,
          ChatDrive,
          completedCommands.filter(Boolean) as string[]
        );
      }

      isProcessing.current = false;
    })();
  }, [dotYouClient, identity, isEnabled, queryClient]);
};
