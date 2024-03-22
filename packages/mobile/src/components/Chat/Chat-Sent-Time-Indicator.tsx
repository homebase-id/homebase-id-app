import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { memo } from 'react';
import { Text } from 'react-native';
import { formatToTimeAgoWithRelativeDetail } from 'feed-app-common';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';

export const ChatSentTimeIndicator = memo(
  ({ msg, keepDetail }: { msg: DriveSearchResult<ChatMessage>; keepDetail?: boolean }) => {
    const { isDarkMode } = useDarkMode();
    if (!msg.fileMetadata.created) return null;

    const date = new Date(msg.fileMetadata.created);
    if (!date) return <Text>Unknown</Text>;
    return (
      <Text style={{ fontSize: 12, color: isDarkMode ? Colors.slate[300] : Colors.slate[500] }}>
        {formatToTimeAgoWithRelativeDetail(date, keepDetail)}
      </Text>
    );
  }
);
