import { HomebaseFile } from '@youfoundation/js-lib/core';
import { ChatDeliveryStatus, ChatMessage } from '../../provider/chat/ChatProvider';
import { useDotYouClientContext } from 'feed-app-common';
import { View } from 'react-native';
import { Clock, SubtleCheck } from '../ui/Icons/icons';
import { Colors } from '../../app/Colors';
import { ChatMessageIMessage } from './ChatDetail';

export const ChatDeliveryIndicator = ({
  msg,
  showDefaultColor,
}: {
  msg: ChatMessageIMessage | HomebaseFile<ChatMessage>;
  showDefaultColor?: boolean;
}) => {
  const identity = useDotYouClientContext().getIdentity();
  const content = msg.fileMetadata.appData.content;
  const authorOdinId = msg.fileMetadata.senderOdinId;
  const messageFromMe = !authorOdinId || authorOdinId === identity;

  if (!messageFromMe) return null;
  return <InnerDeliveryIndicator state={content.deliveryStatus} showDefault={showDefaultColor} />;
};

export const InnerDeliveryIndicator = ({
  state,
  showDefault,
}: {
  state?: ChatDeliveryStatus;
  showDefault?: boolean;
}) => {
  const isSent = state && state >= ChatDeliveryStatus.Sent;
  const isDelivered = state && state >= ChatDeliveryStatus.Delivered;
  const isRead = state === ChatDeliveryStatus.Read;

  return (
    <View
      style={{
        flexDirection: 'row',

        alignContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      {isDelivered ? (
        <SubtleCheck
          size={'sm'}
          color={isRead ? (showDefault ? Colors.indigo[400] : Colors.white) : Colors.gray[400]}
        />
      ) : null}
      <View
        style={{
          right: isSent ? 8 : 0,
          marginRight: !isSent ? 8 : 0,
          zIndex: 10,
        }}
      >
        {isSent ? (
          <SubtleCheck
            size={'sm'}
            color={isRead ? (showDefault ? Colors.indigo[400] : Colors.white) : Colors.gray[400]}
          />
        ) : (
          <Clock size={'sm'} />
        )}
      </View>
    </View>
  );
};
