import { HomebaseFile } from '@youfoundation/js-lib/core';
import { ChatDeliveryStatus, ChatMessage } from '../../provider/chat/ChatProvider';
import { t, useDotYouClientContext } from 'feed-app-common';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Clock, SubtleCheck, Times } from '../ui/Icons/icons';
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

export const FailedDeliveryDetails = ({
  msg,
  recipient,
  style,
}: {
  msg: HomebaseFile<ChatMessage>;
  recipient: string;
  style?: StyleProp<TextStyle>;
}) => {
  const deliveryDetails = msg.serverMetadata?.transferHistory?.recipients[recipient];
  if (!deliveryDetails) return null;
  if (deliveryDetails.latestSuccessfullyDeliveredVersionTag) return null;

  return (
    <Text
      style={[
        {
          color: Colors.red[500],
        },
        style,
      ]}
    >
      {t(deliveryDetails.latestTransferStatus)}
    </Text>
  );
};

export const InnerDeliveryIndicator = ({
  state,
  showDefault,
  style,
}: {
  state?: ChatDeliveryStatus;
  showDefault?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const isSent = state && state >= ChatDeliveryStatus.Sent;
  const isDelivered = state && state >= ChatDeliveryStatus.Delivered;
  const isFailed = state === ChatDeliveryStatus.Failed;
  const isRead = state === ChatDeliveryStatus.Read;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <View
        style={{
          paddingBottom: 4,
          marginRight: 8,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          width: 20,
          height: 20,
          overflow: 'hidden',
        }}
      >
        {isFailed ? (
          <Times size={'sm'} color={Colors.red[500]} />
        ) : isDelivered ? (
          <View style={{ position: 'relative', display: 'flex', flexDirection: 'row', gap: -9 }}>
            <SubtleCheck
              size={'sm'}
              color={isRead ? (showDefault ? Colors.indigo[400] : Colors.white) : Colors.gray[400]}
            />
            <SubtleCheck
              size={'sm'}
              color={isRead ? (showDefault ? Colors.indigo[400] : Colors.white) : Colors.gray[400]}
            />
          </View>
        ) : isSent ? (
          <SubtleCheck
            size={'sm'}
            color={isRead ? (showDefault ? Colors.indigo[400] : Colors.white) : Colors.gray[400]}
          />
        ) : (
          <Clock size={'xs'} color={Colors.gray[200]} />
        )}
      </View>
    </View>
  );
};
