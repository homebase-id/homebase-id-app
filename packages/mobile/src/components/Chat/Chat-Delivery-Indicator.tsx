import { HomebaseFile, RecipientTransferHistory } from '@homebase-id/js-lib/core';
import { ChatDeliveryStatus, ChatMessage } from '../../provider/chat/ChatProvider';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Clock, SubtleCheck, Times } from '../ui/Icons/icons';
import { Colors } from '../../app/Colors';
import { ChatMessageIMessage } from './ChatDetail';
import { useCallback } from 'react';

export const ChatDeliveryIndicator = ({
  msg,
  showDefaultColor,
  onPress,
}: {
  msg: ChatMessageIMessage | HomebaseFile<ChatMessage>;
  showDefaultColor?: boolean;
  onPress?: () => void;
}) => {
  const identity = useDotYouClientContext().getLoggedInIdentity();
  const content = msg.fileMetadata.appData.content;
  const authorOdinId = msg.fileMetadata.senderOdinId || identity;
  const messageFromMe = !authorOdinId || authorOdinId === identity;

  if (!messageFromMe) return null;
  return (
    <InnerDeliveryIndicator
      state={content.deliveryStatus}
      showDefault={showDefaultColor}
      onPress={onPress}
    />
  );
};

export const FailedDeliveryDetails = ({
  transferHistory,
  style,
}: {
  transferHistory: RecipientTransferHistory | undefined;
  style?: StyleProp<TextStyle>;
}) => {
  if (!transferHistory) return null;
  if (transferHistory.latestSuccessfullyDeliveredVersionTag) return null;

  return (
    <Text
      style={[
        {
          color: Colors.red[500],
        },
        style,
      ]}
    >
      {t(transferHistory.latestTransferStatus)}
    </Text>
  );
};

export const InnerDeliveryIndicator = ({
  state,
  showDefault,
  style,
  onPress,
}: {
  state?: ChatDeliveryStatus;
  showDefault?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const isSent = state && state >= ChatDeliveryStatus.Sent;
  const isDelivered = state && state >= ChatDeliveryStatus.Delivered;
  const isFailed = state === ChatDeliveryStatus.Failed;
  const isRead = state === ChatDeliveryStatus.Read;

  const Wrapper = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      if (onPress) {
        return (
          <Pressable
            onPress={onPress}
            style={[{ flexDirection: 'row', alignItems: 'center' }, style]}
          >
            {children}
          </Pressable>
        );
      }
      return (
        <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>
      );
    },
    [onPress, style]
  );

  return (
    <Wrapper>
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
          <>
            <SubtleCheck
              size={'sm'}
              color={isRead ? (showDefault ? Colors.indigo[400] : Colors.white) : Colors.gray[400]}
              style={{ position: 'relative', left: -2 }}
            />
            <SubtleCheck
              size={'sm'}
              color={isRead ? (showDefault ? Colors.indigo[400] : Colors.white) : Colors.gray[400]}
              style={{ position: 'absolute', left: -11 }}
            />
          </>
        ) : isSent ? (
          <SubtleCheck
            size={'sm'}
            color={isRead ? (showDefault ? Colors.indigo[400] : Colors.white) : Colors.gray[400]}
          />
        ) : (
          <Clock size={'xs'} color={Colors.gray[200]} />
        )}
      </View>
    </Wrapper>
  );
};
