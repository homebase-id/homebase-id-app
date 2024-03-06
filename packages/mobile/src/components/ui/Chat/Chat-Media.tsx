import { MessageImageProps } from 'react-native-gifted-chat';
import { ChatMessageIMessage } from '../../../pages/chat-page';

export const ChatMedia = (prop: MessageImageProps<ChatMessageIMessage>) => {
  const msg = prop.currentMessage as ChatMessageIMessage;
  const payloads = msg.fileMetadata.payloads;
  const isGallery = payloads.length >= 2;
};
