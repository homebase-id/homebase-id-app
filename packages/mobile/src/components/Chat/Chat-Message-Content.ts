import { DEFAULT_PAYLOAD_DESCRIPTOR_KEY, DEFAULT_PAYLOAD_KEY, HomebaseFile } from '@homebase-id/js-lib/core';
import { CHAT_LINKS_PAYLOAD_KEY, ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { ChatMessageIMessage } from './ChatDetail';
import { ellipsisAtMaxChar, getPlainTextFromRichText } from 'homebase-id-app-common';
import { memo } from 'react';

export const ChatMessageContent = memo(
  (message: HomebaseFile<ChatMessage> | ChatMessageIMessage) => {
    let textMessage = message.fileMetadata.appData.content.message;
    textMessage = getPlainTextFromRichText(textMessage);
    const { payloads } = message.fileMetadata;
    const filteredPayloads = payloads?.filter(
      (p) => p.key !== DEFAULT_PAYLOAD_KEY && !p.key.includes(DEFAULT_PAYLOAD_DESCRIPTOR_KEY)
    );
    if (message.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus) {
      return 'This message was deleted';
    }
    if (textMessage?.length > 0) {
      return ellipsisAtMaxChar(getPlainTextFromRichText(textMessage), 30);
    } else if (filteredPayloads && filteredPayloads?.length > 1) {
      return '📸 Medias';
    } else {
      const payload = filteredPayloads?.[0];
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
