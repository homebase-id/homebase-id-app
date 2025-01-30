import { useRef } from 'react';
import { HomebaseFile } from '@homebase-id/js-lib/core';

import { useChatMessages } from './useChatMessages';
import { useEffect, useState } from 'react';
import {
  ConversationMetadata,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { useConversationMetadata } from './useConversationMetadata';
import { useDotYouClientContext } from 'homebase-id-app-common';

export const useMarkMessagesAsRead = ({
  conversation,
  messages,
}: {
  conversation: HomebaseFile<UnifiedConversation, ConversationMetadata> | undefined;
  messages: HomebaseFile<ChatMessage>[] | undefined;
}) => {
  const identity = useDotYouClientContext().getLoggedInIdentity();
  const { mutateAsync: markAsRead } = useChatMessages({
    conversationId: conversation?.fileMetadata.appData.uniqueId,
  }).markAsRead;
  const isProcessing = useRef(false);
  const [messagesMarkedAsRead, setMessagesMarkedAsRead] = useState<boolean>(false);

  const {
    update: { mutate: updateConversationMetadata },
  } = useConversationMetadata({ conversationId: conversation?.fileMetadata.appData.uniqueId });
  const [pendingReadTime, setPendingReadTime] = useState<number | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (!conversation || !messages || isProcessing.current) return;

      const unreadMessages = messages.filter(
        (msg) =>
          (msg?.fileMetadata.transitCreated || msg?.fileMetadata.created) >
            (conversation.fileMetadata.localAppData?.content?.lastReadTime || 0) &&
          (!msg.fileMetadata.senderOdinId || msg.fileMetadata.senderOdinId !== identity)
      );

      const newestMessageCreated = unreadMessages.reduce((acc, msg) => {
        return (msg?.fileMetadata.transitCreated || msg.fileMetadata.created) > acc
          ? msg?.fileMetadata.transitCreated || msg.fileMetadata.created
          : acc;
      }, conversation.fileMetadata.localAppData?.content?.lastReadTime || 0);

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
  }, [messages, conversation, markAsRead, identity]);

  useEffect(() => {
    if (!conversation || !messages || !pendingReadTime) return;
    if (conversation?.fileMetadata?.localAppData?.content?.lastReadTime === pendingReadTime) return;

    if (messagesMarkedAsRead && pendingReadTime && conversation?.fileMetadata?.localAppData) {
      updateConversationMetadata({
        conversation,
        newMetadata: {
          ...conversation?.fileMetadata?.localAppData.content,
          conversationId: conversation.fileMetadata.appData.uniqueId as string,
          lastReadTime: pendingReadTime,
        },
      });
      setPendingReadTime(undefined);
      setMessagesMarkedAsRead(false);
      isProcessing.current = false;
    }
  }, [conversation, messages, messagesMarkedAsRead, pendingReadTime, updateConversationMetadata]);
};
