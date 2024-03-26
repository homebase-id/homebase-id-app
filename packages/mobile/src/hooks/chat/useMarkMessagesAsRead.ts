import { useRef } from 'react';
import { HomebaseFile } from '@youfoundation/js-lib/core';

import { useChatMessages } from './useChatMessages';
import { useEffect, useState } from 'react';
import { Conversation } from '../../provider/chat/ConversationProvider';
import { useConversation } from './useConversation';
import { ChatMessage } from '../../provider/chat/ChatProvider';

export const useMarkMessagesAsRead = ({
  conversation,
  messages,
}: {
  conversation: HomebaseFile<Conversation> | undefined;
  messages: HomebaseFile<ChatMessage>[] | undefined;
}) => {
  const { mutateAsync: markAsRead } = useChatMessages({
    conversationId: conversation?.fileMetadata.appData.uniqueId,
  }).markAsRead;
  const isProcessing = useRef(false);
  const [messagesMarkedAsRead, setMessagesMarkedAsRead] = useState<boolean>(false);

  const { mutate: updateConversation } = useConversation().update;
  const [pendingReadTime, setPendingReadTime] = useState<Date | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (!conversation || !messages || isProcessing.current) return;
      setPendingReadTime(new Date());
      const unreadMessages = messages.filter(
        (msg) =>
          msg?.fileMetadata.created >
            (conversation.fileMetadata.appData.content.lastReadTime || 0) &&
          msg.fileMetadata.senderOdinId
      );

      if (!unreadMessages.length) return;
      isProcessing.current = true;

      // We await the markAsRead (async version), as the mutationStatus isn't shared between hooks;
      // So it can happen that the status would reset in between renders
      await markAsRead({
        conversation: conversation,
        messages: unreadMessages,
      });

      setMessagesMarkedAsRead(true);
    })();
  }, [messages]);

  useEffect(() => {
    if (!conversation || !messages) return;

    if (messagesMarkedAsRead && pendingReadTime && conversation) {
      conversation.fileMetadata.appData.content.lastReadTime = pendingReadTime.getTime();

      updateConversation({ conversation });
      setPendingReadTime(undefined);
      setMessagesMarkedAsRead(false);
      isProcessing.current = false;
    }
  }, [messagesMarkedAsRead]);
};
