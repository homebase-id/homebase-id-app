import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { ChatMessage } from '../../../provider/chat/ChatProvider';
import { Text } from 'react-native';
import { formatToTimeAgoWithRelativeDetail } from 'feed-app-common';
import { Colors } from '../../../app/Colors';

export const ChatSentTimeIndicator = ({
  msg,
  keepDetail,
}: {
  msg: DriveSearchResult<ChatMessage>;
  keepDetail?: boolean;
}) => {
  if (!msg.fileMetadata.created) return null;

  const date = new Date(msg.fileMetadata.created);
  if (!date) return <Text>Unknown</Text>;
  return (
    <Text style={{ fontSize: 12, color: Colors.slate[300] }}>
      {formatToTimeAgoWithRelativeDetail(date, keepDetail)}
    </Text>
  );
};
