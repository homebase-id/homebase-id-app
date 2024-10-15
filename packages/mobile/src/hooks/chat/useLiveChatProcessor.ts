import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AppNotification,
  DeletedHomebaseFile,
  DotYouClient,
  FileQueryParams,
  HomebaseFile,
  ReactionNotification,
  TypedConnectionNotification,
  queryBatch,
  queryModified,
} from '@homebase-id/js-lib/core';
import {
  getQueryBatchCursorFromTime,
  getQueryModifiedCursorFromTime,
} from '@homebase-id/js-lib/helpers';

import { processInbox } from '@homebase-id/js-lib/peer';

import { useNotificationSubscriber } from '../useNotificationSubscriber';
import { useCallback, useEffect, useRef, useState } from 'react';

import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { getConversationQueryOptions, useConversation } from './useConversation';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import {
  CHAT_MESSAGE_FILE_TYPE,
  ChatMessage,
  dsrToMessage,
} from '../../provider/chat/ChatProvider';
import {
  ChatDrive,
  CHAT_CONVERSATION_FILE_TYPE,
  dsrToConversation,
  CHAT_CONVERSATION_LOCAL_METADATA_FILE_TYPE,
  dsrToConversationMetadata,
} from '../../provider/chat/ConversationProvider';
import { insertNewMessage, insertNewMessagesForConversation } from './useChatMessages';
import { insertNewConversation } from './useConversations';
import { useWebSocketContext } from '../../components/WebSocketContext/useWebSocketContext';
import { insertNewConversationMetadata } from './useConversationMetadata';
import {
  incrementAppIdNotificationCount,
  insertNewNotification,
} from '../notifications/usePushNotifications';
import { insertNewReaction, removeReaction } from './useChatReaction';
import { useNotification } from '../notifications/useNotification';
import { useDriveSubscriber } from '../drive/useDriveSubscriber';
import { generateClientError } from '../errors/useErrors';
import { addLogs } from '../../provider/log/logger';

const MINUTE_IN_MS = 60000;
const isDebug = false; // The babel plugin to remove console logs would remove any if they get to production

// We first process the inbox, then we connect for live updates;
export const useLiveChatProcessor = () => {
  const { setIsOnline } = useWebSocketContext();

  // Process the inbox on startup; As we want to cover the backlog of messages first
  const { status: inboxStatus } = useInboxProcessor(true);

  // Only after the inbox is processed, we connect for live updates; So we avoid clearing the cache on each fileAdded update
  const isOnline = useChatWebsocket(inboxStatus === 'success');

  useEffect(() => {
    setIsOnline(isOnline);
  }, [isOnline, setIsOnline]);

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

    isDebug && console.debug('[InboxProcessor] fetching updates since', lastProcessedWithBuffer);
    if (lastProcessedWithBuffer) {
      const updatedMessages = await findChangesSinceTimestamp(
        dotYouClient,
        lastProcessedWithBuffer,
        {
          targetDrive: ChatDrive,
          fileType: [CHAT_MESSAGE_FILE_TYPE],
        }
      );
      isDebug && console.debug('[InboxProcessor] new messages', updatedMessages.length);
      await processChatMessagesBatch(dotYouClient, queryClient, updatedMessages);

      const updatedConversations = await findChangesSinceTimestamp(
        dotYouClient,
        lastProcessedWithBuffer,
        {
          targetDrive: ChatDrive,
          fileType: [CHAT_CONVERSATION_FILE_TYPE],
        }
      );
      isDebug && console.debug('[InboxProcessor] new conversations', updatedConversations.length);
      await processConversationsBatch(dotYouClient, queryClient, updatedConversations);

      const updatedConversationMetadatas = await findChangesSinceTimestamp(
        dotYouClient,
        lastProcessedWithBuffer,
        {
          targetDrive: ChatDrive,
          fileType: [CHAT_CONVERSATION_LOCAL_METADATA_FILE_TYPE],
        }
      );
      isDebug &&
        console.debug('[InboxProcessor] new metadata', updatedConversationMetadatas.length);
      await processConversationsMetadataBatch(
        dotYouClient,
        queryClient,
        updatedConversationMetadatas
      );
    } else {
      // We have no reference to the last time we processed the inbox, so we can only invalidate all chat messages
      queryClient.invalidateQueries({ queryKey: ['chat-messages'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['conversations'], exact: false });
    }

    return processedresult;
  };

  // We refetch this one on mount as each mount the websocket would reconnect, and there might be a backlog of messages
  return useQuery({
    queryKey: ['process-inbox'],
    queryFn: fetchData,
    throwOnError: (error, _) => {
      const newError = generateClientError(error, t('Something went wrong while processing inbox'));
      addLogs(newError);
      return false;
    },
    enabled: connected,
    staleTime: 500, // 500ms
  });
};

const useChatWebsocket = (isEnabled: boolean) => {
  const dotYouClient = useDotYouClientContext();
  const identity = dotYouClient.getIdentity();

  // Added to ensure we have the conversation query available
  const {
    restoreChat: { mutate: restoreChat },
  } = useConversation();
  const { add } = useNotification();
  const queryClient = useQueryClient();
  const { data: subscribedDrives, isFetched } = useDriveSubscriber();

  const [chatMessagesQueue, setChatMessagesQueue] = useState<HomebaseFile<ChatMessage>[]>([]);

  const handler = useCallback(async (notification: TypedConnectionNotification) => {
    isDebug && console.debug('[ChatWebsocket] Got notification', notification);

    if (
      (notification.notificationType === 'fileAdded' ||
        notification.notificationType === 'fileModified' ||
        notification.notificationType === 'statisticsChanged') &&
      stringGuidsEqual(notification.targetDrive?.alias, ChatDrive.alias) &&
      stringGuidsEqual(notification.targetDrive?.type, ChatDrive.type)
    ) {
      if (notification.header.fileMetadata.appData.fileType === CHAT_MESSAGE_FILE_TYPE) {
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
          // Something is up with the message, invalidate all messages for this conversation
          console.warn('[ChatWebsocket] Invalid message received', notification, conversationId);
          queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
          return;
        }

        if (updatedChatMessage.fileMetadata.senderOdinId !== identity) {
          // Messages from others are processed immediately
          insertNewMessage(queryClient, updatedChatMessage);
        } else {
          setChatMessagesQueue((prev) => [...prev, updatedChatMessage]);
        }
      } else if (
        notification.header.fileMetadata.appData.fileType === CHAT_CONVERSATION_FILE_TYPE
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
      } else if (
        notification.header.fileMetadata.appData.fileType ===
        CHAT_CONVERSATION_LOCAL_METADATA_FILE_TYPE
      ) {
        const updatedMetadata = await dsrToConversationMetadata(
          dotYouClient,
          notification.header,
          ChatDrive,
          true
        );

        if (!updatedMetadata) return;

        insertNewConversationMetadata(queryClient, updatedMetadata);
      }
    }

    if (notification.notificationType === 'appNotificationAdded') {
      const clientNotification = notification as AppNotification;
      add(clientNotification);
      insertNewNotification(queryClient, clientNotification);
      incrementAppIdNotificationCount(queryClient, clientNotification.options.appId);
    }

    if (
      notification.notificationType === 'reactionContentAdded' ||
      notification.notificationType === 'reactionContentDeleted'
    ) {
      if (notification.notificationType === 'reactionContentAdded') {
        insertNewReaction(
          queryClient,
          notification.fileId.fileId,
          notification as ReactionNotification
        );
      } else if (notification.notificationType === 'reactionContentDeleted') {
        removeReaction(
          queryClient,
          notification.fileId.fileId,
          notification as ReactionNotification
        );
      }
    }
    // Yes, we don't follow the useCallback rules here but we think we know what we're doing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chatMessagesQueueTunnel = useRef<HomebaseFile<ChatMessage>[]>([]);
  const processQueue = useCallback(async (queuedMessages: HomebaseFile<ChatMessage>[]) => {
    isDebug && console.debug('[ChatWebsocket] Processing queue', queuedMessages.length);
    setChatMessagesQueue([]);
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }

    const queuedMessagesWithLastUpdated = queuedMessages.map((m) => ({
      ...m,
      fileMetadata: {
        ...m.fileMetadata,
        updated:
          Object.values(m.serverMetadata?.transferHistory?.recipients || []).reduce((acc, cur) => {
            return Math.max(acc, cur.lastUpdated || 0);
          }, 0) ||
          m.fileMetadata.updated ||
          0,
      },
    }));

    // Filter out duplicate messages and select the one with the latest updated property
    const filteredMessages = queuedMessagesWithLastUpdated.reduce((acc, message) => {
      const existingMessage = acc.find((m) => stringGuidsEqual(m.fileId, message.fileId));
      if (!existingMessage) {
        acc.push(message);
      } else if (existingMessage.fileMetadata.updated < message.fileMetadata.updated) {
        acc[acc.indexOf(existingMessage)] = message;
      }
      return acc;
    }, [] as HomebaseFile<ChatMessage>[]);

    await processChatMessagesBatch(dotYouClient, queryClient, filteredMessages);
    // Yes, we don't follow the useCallback rules here but we think we know what we're doing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Using a ref as it's part of the global closure so we can easily pass the latest queue into the timeout
    chatMessagesQueueTunnel.current = [...chatMessagesQueue];

    if (chatMessagesQueue.length >= 1) {
      if (!timeout.current) {
        // Start timeout to always process the queue after a certain time
        timeout.current = setTimeout(() => processQueue(chatMessagesQueueTunnel.current), 700);
      }
    }

    if (chatMessagesQueue.length > 25) {
      processQueue(chatMessagesQueue);
    }
  }, [processQueue, chatMessagesQueue]);

  return useNotificationSubscriber(
    isEnabled && isFetched ? handler : undefined,
    [
      'fileAdded',
      'fileModified',
      'reactionContentAdded',
      'reactionContentDeleted',
      'statisticsChanged',
      'appNotificationAdded',
    ],
    subscribedDrives || [],
    () => {
      queryClient.invalidateQueries({ queryKey: ['process-inbox'] });
    }
  );
};

const findChangesSinceTimestamp = async (
  dotYouClient: DotYouClient,
  timeStamp: number,
  params: FileQueryParams
) => {
  const modifiedCursor = getQueryModifiedCursorFromTime(timeStamp); // Friday, 31 May 2024 09:38:54.678
  const batchCursor = getQueryBatchCursorFromTime(new Date().getTime(), timeStamp);

  const newFiles = await queryBatch(dotYouClient, params, {
    maxRecords: BATCH_SIZE,
    cursorState: batchCursor,
    includeMetadataHeader: true,
    includeTransferHistory: true,
  });

  const modifiedFiles = await queryModified(dotYouClient, params, {
    maxRecords: BATCH_SIZE,
    cursor: modifiedCursor,
    excludePreviewThumbnail: false,
    includeHeaderContent: true,
    includeTransferHistory: true,
  });

  return modifiedFiles.searchResults.concat(newFiles.searchResults);
};

const processChatMessagesBatch = async (
  dotYouClient: DotYouClient,
  queryClient: QueryClient,
  chatMessages: (HomebaseFile<string | ChatMessage> | DeletedHomebaseFile<string>)[]
) => {
  const uniqueMessagesPerConversation = chatMessages.reduce(
    (acc, dsr) => {
      if (!dsr.fileMetadata?.appData?.groupId || dsr.fileState === 'deleted') {
        return acc;
      }

      const conversationId = dsr.fileMetadata?.appData.groupId as string;
      if (!acc[conversationId]) {
        acc[conversationId] = [];
      }

      if (acc[conversationId].some((m) => stringGuidsEqual(m.fileId, dsr.fileId))) {
        return acc;
      }

      acc[conversationId].push(dsr);
      return acc;
    },
    {} as Record<string, HomebaseFile<string | ChatMessage>[]>
  );
  isDebug &&
    console.debug(
      '[InboxProcessor] new conversation updates',
      Object.keys(uniqueMessagesPerConversation).length
    );

  await Promise.all(
    Object.keys(uniqueMessagesPerConversation).map(async (updatedConversation) => {
      const updatedChatMessages = (
        await Promise.all(
          uniqueMessagesPerConversation[updatedConversation].map(async (newMessage) =>
            typeof newMessage.fileMetadata.appData.content === 'string'
              ? await dsrToMessage(
                dotYouClient,
                newMessage as HomebaseFile<string>,
                ChatDrive,
                true
              )
              : (newMessage as HomebaseFile<ChatMessage>)
          )
        )
      ).filter(Boolean) as HomebaseFile<ChatMessage>[];
      insertNewMessagesForConversation(queryClient, updatedConversation, updatedChatMessages);
    })
  );
};

const processConversationsBatch = async (
  dotYouClient: DotYouClient,
  queryClient: QueryClient,
  conversations: (HomebaseFile<string> | DeletedHomebaseFile<string>)[]
) => {
  await Promise.all(
    conversations.map(async (conversationsDsr) => {
      if (conversationsDsr.fileState === 'deleted') {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        return;
      }

      const updatedConversation = await dsrToConversation(
        dotYouClient,
        conversationsDsr,
        ChatDrive,
        true
      );

      if (!updatedConversation) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        return;
      }

      insertNewConversation(queryClient, updatedConversation);
    })
  );
};

const processConversationsMetadataBatch = async (
  dotYouClient: DotYouClient,
  queryClient: QueryClient,
  conversations: (HomebaseFile<string> | DeletedHomebaseFile<string>)[]
) => {
  await Promise.all(
    conversations.map(async (conversationsDsr) => {
      if (conversationsDsr.fileState === 'deleted') {
        queryClient.invalidateQueries({ queryKey: ['conversation-metadata'], exact: false });
        return;
      }

      const updatedMetadata = await dsrToConversationMetadata(
        dotYouClient,
        conversationsDsr,
        ChatDrive,
        true
      );

      if (!updatedMetadata) {
        queryClient.invalidateQueries({ queryKey: ['conversation-metadata'], exact: false });
        return;
      }

      insertNewConversationMetadata(queryClient, updatedMetadata);
    })
  );
};
