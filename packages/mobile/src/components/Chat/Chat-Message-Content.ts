import { HomebaseFile } from '@homebase-id/js-lib/core';
import { CHAT_LINKS_PAYLOAD_KEY, ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { ChatMessageIMessage } from './ChatDetail';
import { ellipsisAtMaxChar, getPlainTextFromRichText } from 'homebase-id-app-common';
import { memo } from 'react';

export const ChatMessageContent = memo(
  (message: HomebaseFile<ChatMessage> | ChatMessageIMessage) => {
    let textMessage = message.fileMetadata.appData.content.message;
    textMessage = getPlainTextFromRichText(textMessage);
    const { payloads } = message.fileMetadata;
    if (message.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus) {
      return 'This message was deleted';
    }
    if (textMessage?.length > 0) {
      return ellipsisAtMaxChar(getPlainTextFromRichText(textMessage), 30);
    } else if (payloads && payloads?.length > 1) {
      return '📸 Medias';
    } else {
      const payload = payloads?.[0];
      if (!payload) return null;
      if (payload.contentType.startsWith('image')) {
        return '📷 Image';
      } else if (
        payload.contentType.startsWith('video') ||
        payload.contentType === 'application/vnd.apple.mpegurl'
      ) {
        return '🎥 Video';
      } else if (payload.contentType.startsWith('audio')) {
        return '🎵 Audio';
      } else if (payload.key === CHAT_LINKS_PAYLOAD_KEY) {
        return '🔗 Link';
      } else {
        return '📄 File';
      }
    }
  }
);
