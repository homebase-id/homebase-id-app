import { useRef } from 'react';
import { HomebaseFile } from '@youfoundation/js-lib/core';

import { useChatMessages } from './useChatMessages';
import { useEffect, useState } from 'react';
import { UnifiedConversation } from '../../provider/chat/ConversationProvider';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { useConversationMetadata } from './useConversationMetadata';

export const useMarkMessagesAsRead = ({
  conversation,
  messages,
}: {
  conversation: HomebaseFile<UnifiedConversation> | undefined;
  messages: HomebaseFile<ChatMessage>[] | undefined;
}) => {
  const { mutateAsync: markAsRead } = useChatMessages({
    conversationId: conversation?.fileMetadata.appData.uniqueId,
  }).markAsRead;
  const isProcessing = useRef(false);
  const [messagesMarkedAsRead, setMessagesMarkedAsRead] = useState<boolean>(false);

  const {
    single: { data: conversationMetadata },
    update: { mutate: updateConversationMetadata },
  } = useConversationMetadata({ conversationId: conversation?.fileMetadata.appData.uniqueId });
  const [pendingReadTime, setPendingReadTime] = useState<number | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (!conversation || !conversationMetadata || !messages || isProcessing.current) return;

      const unreadMessages = messages.filter(
        (msg) =>
          (msg?.fileMetadata.transitCreated || msg?.fileMetadata.created) >
          (conversationMetadata.fileMetadata.appData.content.lastReadTime || 0) &&
          msg.fileMetadata.senderOdinId
      );

      const newestMessageCreated = unreadMessages.reduce((acc, msg) => {
        return (msg?.fileMetadata.transitCreated || msg.fileMetadata.created) > acc
          ? msg?.fileMetadata.transitCreated || msg.fileMetadata.created
          : acc;
      }, conversationMetadata.fileMetadata.appData.content.lastReadTime || 0);

      setPendingReadTime(newestMessageCreated);

      if (!unreadMessages.length) return;
      isProcessing.current = true;

      try {
        // We await the markAsRead (async version), as the mutationStatus isn't shared between hooks;
        // So it can happen that the status would reset in between renders
        await markAsRead({
          conversation: conversation,
          messages: unreadMessages,
        });

        setMessagesMarkedAsRead(true);
      } catch (e) {
        console.error('Error marking messages as read', e);
        setMessagesMarkedAsRead(false);
        isProcessing.current = false;
      }
    })();
  }, [messages, conversationMetadata]);

  useEffect(() => {
    if (!conversation || !messages) return;

    if (messagesMarkedAsRead && pendingReadTime && conversationMetadata) {
      updateConversationMetadata({
        conversation: {
          ...conversationMetadata,
          fileMetadata: {
            ...conversationMetadata.fileMetadata,
            appData: {
              ...conversation.fileMetadata.appData,
              content: {
                ...conversationMetadata.fileMetadata.appData.content,
                lastReadTime: pendingReadTime,
              },
            },
          },
        },
      });
      setPendingReadTime(undefined);
      setMessagesMarkedAsRead(false);
      isProcessing.current = false;
    }
  }, [messagesMarkedAsRead]);
};
