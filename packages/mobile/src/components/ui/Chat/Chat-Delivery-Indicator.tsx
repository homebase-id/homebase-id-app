import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { ChatDeliveryStatus, ChatMessage } from '../../../provider/chat/ChatProvider';
import { useDotYouClientContext } from 'feed-app-common';
import { View } from 'react-native';
import { Clock, SubtleCheck } from '../Icons/icons';
import { Colors } from '../../../app/Colors';
import { ChatMessageIMessage } from '../../../pages/chat-page';

export const ChatDeliveryIndicator = ({
  msg,
}: {
  msg: ChatMessageIMessage | DriveSearchResult<ChatMessage>;
}) => {
  const identity = useDotYouClientContext().getIdentity();
  const content = msg.fileMetadata.appData.content;
  const authorOdinId = msg.fileMetadata.senderOdinId;
  const messageFromMe = !authorOdinId || authorOdinId === identity;

  if (!messageFromMe) return null;
  return <InnerDeliveryIndicator state={content.deliveryStatus} />;
};

export const InnerDeliveryIndicator = ({ state }: { state?: ChatDeliveryStatus }) => {
  const isSent = state && state >= ChatDeliveryStatus.Sent;
  const isDelivered = state && state >= ChatDeliveryStatus.Delivered;
  const isRead = state === ChatDeliveryStatus.Read;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'center',
        alignContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      {isDelivered ? (
        <SubtleCheck size={'sm'} color={isRead ? Colors.blue[600] : undefined} />
      ) : null}
      <View
        style={{
          right: isSent ? 8 : 0,
          zIndex: 10,
        }}
      >
        {isSent ? (
          <SubtleCheck size={'sm'} color={isRead ? Colors.blue[600] : undefined} />
        ) : (
          <Clock size={'sm'} />
        )}
      </View>
    </View>
  );
};
