import { HomebaseFile } from '@youfoundation/js-lib/core';
import { ChatDeletedArchivalStaus, ChatMessage } from '../../provider/chat/ChatProvider';
import { ChatMessageIMessage } from './ChatDetail';
import { ellipsisAtMaxChar } from 'feed-app-common';
import { memo } from 'react';

export const ChatMessageContent = memo(
  (message: HomebaseFile<ChatMessage> | ChatMessageIMessage) => {
    const textMessage = message.fileMetadata.appData.content.message;
    const { payloads } = message.fileMetadata;
    if (message.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus) {
      return 'This message was deleted';
    }
    if (textMessage && textMessage.length > 0) {
      return ellipsisAtMaxChar(textMessage, 30);
    } else if (payloads.length > 1) {
      return '📸 Medias';
    } else {
      const payload = payloads[0];
      if (!payload) return null;
      if (payload.contentType.includes('image')) {
        return '📷 Image';
      } else if (payload.contentType.includes('video')) {
        return '🎥 Video';
      } else if (payload.contentType.includes('audio')) {
        return '🎵 Audio';
      } else if (payload.contentType.includes('application')) {
        return '📄 Document';
      } else {
        return '📁 File';
      }
    }
  }
);
