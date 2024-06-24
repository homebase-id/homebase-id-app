import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HomebaseFile,
  TypedConnectionNotification,
  queryBatch,
  queryModified,
} from '@youfoundation/js-lib/core';
import {
  getQueryBatchCursorFromTime,
  getQueryModifiedCursorFromTime,
} from '@youfoundation/js-lib/helpers';

import { processInbox } from '@youfoundation/js-lib/peer';

import { useNotificationSubscriber } from '../useNotificationSubscriber';
import { useCallback } from 'react';

import { stringGuidsEqual } from '@youfoundation/js-lib/helpers';
import { getConversationQueryOptions, useConversation } from './useConversation';
import { useDotYouClientContext } from 'feed-app-common';
import {
  CHAT_MESSAGE_FILE_TYPE,
  ChatMessage,
  dsrToMessage,
} from '../../provider/chat/ChatProvider';
import {
  ChatDrive,
  CHAT_CONVERSATION_FILE_TYPE,
  GROUP_CHAT_CONVERSATION_FILE_TYPE,
  dsrToConversation,
} from '../../provider/chat/ConversationProvider';
import { ChatReactionFileType } from '../../provider/chat/ChatReactionProvider';
import { insertNewMessage, insertNewMessagesForConversation } from './useChatMessages';
import { insertNewConversation } from './useConversations';

const MINUTE_IN_MS = 60000;

// We first process the inbox, then we connect for live updates;
export const useLiveChatProcessor = () => {
  // Process the inbox on startup; As we want to cover the backlog of messages first
  const { status: inboxStatus } = useInboxProcessor(true);

  // Only after the inbox is processed, we connect for live updates; So we avoid clearing the cache on each fileAdded update
  const isOnline = useChatWebsocket(inboxStatus === 'success');

  return isOnline;
};

const BATCH_SIZE = 2000;
// Process the inbox on startup
const useInboxProcessor = (connected?: boolean) => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const fetchData = async () => {
    const lastProcessedTime = queryClient.getQueryState(['process-inbox'])?.dataUpdatedAt;
    const lastProcessedWithBuffer = lastProcessedTime && lastProcessedTime - MINUTE_IN_MS * 2;

    const processedresult = await processInbox(dotYouClient, ChatDrive, BATCH_SIZE);

    if (lastProcessedWithBuffer) {
      const modifiedCursor = getQueryModifiedCursorFromTime(lastProcessedWithBuffer); // Friday, 31 May 2024 09:38:54.678
      const batchCursor = getQueryBatchCursorFromTime(
        new Date().getTime(),
        lastProcessedWithBuffer
      );

      const newData = await queryBatch(
        dotYouClient,
        {
          targetDrive: ChatDrive,
          fileType: [CHAT_MESSAGE_FILE_TYPE],
        },
        {
          maxRecords: BATCH_SIZE,
          cursorState: batchCursor,
          includeMetadataHeader: true,
        }
      );

      const modifieData = await queryModified(
        dotYouClient,
        {
          targetDrive: ChatDrive,
          fileType: [CHAT_MESSAGE_FILE_TYPE],
        },
        {
          maxRecords: BATCH_SIZE,
          cursor: modifiedCursor,
          excludePreviewThumbnail: false,
          includeHeaderContent: true,
          includeTransferHistory: true,
        },
        { decrypt: true }
      );

      const newMessages = modifieData.searchResults.concat(newData.searchResults);
      console.log('new messages', newMessages.length);

      const latestMessagesPerConversation = newMessages.reduce(
        (acc, dsr) => {
          if (!dsr.fileMetadata?.appData?.groupId || dsr.fileState === 'deleted') {
            return acc;
          }

          const conversationId = dsr.fileMetadata?.appData.groupId as string;
          if (!acc[conversationId]) {
            acc[conversationId] = [];
          }
          const existingFileUpdateIndex = acc[conversationId].findIndex((m) =>
            stringGuidsEqual(m.fileId, dsr.fileId)
          );
          if (existingFileUpdateIndex !== -1) {
            if (
              acc[conversationId][existingFileUpdateIndex]?.fileMetadata?.updated >
              dsr?.fileMetadata?.updated
            ) {
              return acc;
            } else {
              acc[conversationId] = acc[conversationId].map((_, index) =>
                index === existingFileUpdateIndex ? dsr : _
              );
              return acc;
            }
          }

          acc[conversationId].push(dsr);
          return acc;
        },
        {} as Record<string, HomebaseFile<string>[]>
      );

      console.log('new conversations', Object.keys(latestMessagesPerConversation).length);

      await Promise.all(
        Object.keys(latestMessagesPerConversation).map(async (updatedConversation) => {
          const updatedChatMessages = (
            await Promise.all(
              latestMessagesPerConversation[updatedConversation].map(
                async (newMessage) => await dsrToMessage(dotYouClient, newMessage, ChatDrive, true)
              )
            )
          ).filter(Boolean) as HomebaseFile<ChatMessage>[];
          insertNewMessagesForConversation(queryClient, updatedConversation, updatedChatMessages);
        })
      );
      console.log('processed new messages');
    } else {
      console.log('invalidate all');
      // We have no reference to the last time we processed the inbox, so we can only invalidate all chat messages
      queryClient.invalidateQueries({ queryKey: ['chat-messages'], exact: false });
    }

    return processedresult;
  };

  // We refetch this one on mount as each mount the websocket would reconnect, and there might be a backlog of messages
  return useQuery({
    queryKey: ['process-inbox'],
    queryFn: fetchData,
    enabled: connected,
    throwOnError: true,
  });
};

const isDebug = false;

const useChatWebsocket = (isEnabled: boolean) => {
  const dotYouClient = useDotYouClientContext();

  // Added to ensure we have the conversation query available
  const {
    restoreChat: { mutate: restoreChat },
  } = useConversation();
  const queryClient = useQueryClient();

  const handler = useCallback(async (notification: TypedConnectionNotification) => {
    isDebug && console.debug('[ChatWebsocket] Got notification', notification);

    if (
      (notification.notificationType === 'fileAdded' ||
        notification.notificationType === 'fileModified') &&
      stringGuidsEqual(notification.targetDrive?.alias, ChatDrive.alias) &&
      stringGuidsEqual(notification.targetDrive?.type, ChatDrive.type)
    ) {
      if (notification.header.fileMetadata.appData.fileType === CHAT_MESSAGE_FILE_TYPE) {
        console.log('WS: event fileAdded/fileModified', notification.header.fileId);

        const conversationId = notification.header.fileMetadata.appData.groupId;
        const isNewFile = notification.notificationType === 'fileAdded';

        if (isNewFile) {
          // Check if the message is orphaned from a conversation
          const conversation = await queryClient.fetchQuery(
            getConversationQueryOptions(dotYouClient, queryClient, conversationId)
          );

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

        insertNewMessage(queryClient, updatedChatMessage, !isNewFile);
      } else if (notification.header.fileMetadata.appData.fileType === ChatReactionFileType) {
        const messageId = notification.header.fileMetadata.appData.groupId;
        queryClient.invalidateQueries({ queryKey: ['chat-reaction', messageId] });
      } else if (
        notification.header.fileMetadata.appData.fileType === CHAT_CONVERSATION_FILE_TYPE ||
        notification.header.fileMetadata.appData.fileType === GROUP_CHAT_CONVERSATION_FILE_TYPE
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

        insertNewConversation(queryClient, updatedConversation, !isNewFile);
      }
    }
  }, []);

  return useNotificationSubscriber(
    isEnabled ? handler : undefined,
    ['fileAdded', 'fileModified'],
    [ChatDrive],
    () => {
      queryClient.invalidateQueries({ queryKey: ['process-inbox'] });
    }
  );
};
