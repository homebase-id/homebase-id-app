import { Message, MessageProps } from 'react-native-gifted-chat';
import { ChatMessageIMessage } from './ChatDetail';
import { Info, Reply } from '../ui/Icons/icons';
import { ChatDeletedArchivalStaus } from '../../provider/chat/ChatProvider';
import { memo, useMemo } from 'react';

type ChatMessageBoxProps = {
  setReplyOnSwipeOpen: (message: ChatMessageIMessage) => void;
  onLeftSwipeOpen: (message: ChatMessageIMessage) => void;
} & MessageProps<ChatMessageIMessage>;

const ChatMessageBox = memo(
  ({ setReplyOnSwipeOpen, onLeftSwipeOpen, ...props }: ChatMessageBoxProps) => {
    const enabled = useMemo(
      () =>
        props.currentMessage &&
        props.currentMessage.fileMetadata.appData.archivalStatus !== ChatDeletedArchivalStaus,
      [props.currentMessage]
    );

    return (
      <Message
        {...props}
        renderLeftIcon={<Info />}
        renderRightIcon={<Reply />}
        onLeftSwipeOpen={onLeftSwipeOpen}
        onRightSwipeOpen={setReplyOnSwipeOpen}
        swipeableProps={{
          friction: 3,
          overshootFriction: 8,
          activeOffsetX: [-30, 30],
          failOffsetY: [-30, 30],
          rightThreshold: 40,
          leftThreshold: 20,
          enabled: enabled,
        }}
      />
    );
  }
);

export default ChatMessageBox;
