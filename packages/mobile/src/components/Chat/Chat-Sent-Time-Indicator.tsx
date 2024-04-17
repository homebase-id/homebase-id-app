import { HomebaseFile } from '@youfoundation/js-lib/core';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { memo, useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { formatToTimeAgoWithRelativeDetail } from 'feed-app-common';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';

export const ChatSentTimeIndicator = memo(
  ({ msg, keepDetail }: { msg: HomebaseFile<ChatMessage>; keepDetail?: boolean }) => {
    const { isDarkMode } = useDarkMode();
    const date = useMemo(() => new Date(msg.fileMetadata.created), [msg.fileMetadata.created]);
    const [formattedDate, setformattedDate] = useState<string | undefined>(
      formatToTimeAgoWithRelativeDetail(date, keepDetail)
    );

    useEffect(() => {
      const interval = setInterval(() => {
        const newFormattedDate = formatToTimeAgoWithRelativeDetail(date, keepDetail);
        if (newFormattedDate !== formattedDate) {
          setformattedDate(newFormattedDate);
        }
      }, 1000 * 60);
      return () => clearInterval(interval);
    }, [date, formattedDate, keepDetail]);

    if (!msg.fileMetadata.created) return null;
    return (
      <Text style={{ fontSize: 12, color: isDarkMode ? Colors.slate[300] : Colors.slate[500] }}>
        {formattedDate || 'Unknown'}
      </Text>
    );
  }
);
