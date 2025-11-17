import { HomebaseFile } from '@homebase-id/js-lib/core';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { memo, useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { formatToTimeAgoWithRelativeDetail } from 'homebase-id-app-common';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';

export const ChatSentTimeIndicator = memo(
  ({
    msg,
    keepDetail,
    conversationLastUpdated,
  }: {
    msg?: HomebaseFile<ChatMessage>;
    keepDetail?: boolean;
    conversationLastUpdated: number;
  }) => {
    const { isDarkMode } = useDarkMode();
    const date = useMemo(
      () => new Date(msg?.fileMetadata.transitCreated || conversationLastUpdated),
      [msg, conversationLastUpdated]
    );
    const [_, setStateIndex] = useState(0);

    useEffect(() => {
      if (date.getTime() > Date.now() - 3600000) {
        const interval = setInterval(() => {
          // If the date is less than 1 hour ago, update every 1 minute
          setStateIndex((old) => old + 1);
        }, 1000 * 60);

        return () => clearInterval(interval);
      }
    }, [date]);

    return (
      <Text style={{ fontSize: 12, color: isDarkMode ? Colors.slate[300] : Colors.slate[500] }}>
        {formatToTimeAgoWithRelativeDetail(date, keepDetail) || 'Unknown'}
      </Text>
    );
  }
);
