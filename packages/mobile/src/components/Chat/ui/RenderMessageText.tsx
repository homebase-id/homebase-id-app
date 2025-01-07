import { DEFAULT_PAYLOAD_KEY } from '@homebase-id/js-lib/core';
import { getPlainTextFromRichText } from 'homebase-id-app-common';
import { memo, useCallback, useEffect, useState } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MessageTextProps, IMessage, MessageText } from 'react-native-gifted-chat';
import { ParseShape } from 'react-native-parsed-text';
import Toast from 'react-native-toast-message';
import { useChatMessagePayload } from '../../../hooks/chat/useChatMessagePayload';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { ChatDeletedArchivalStaus } from '../../../provider/chat/ChatProvider';
import { isEmojiOnly, openURL, URL_PATTERN } from '../../../utils/utils';
import { AuthorName } from '../../ui/Name';
import { ChatMessageIMessage } from '../ChatDetail';
import Clipboard from '@react-native-clipboard/clipboard';
import { Colors } from '../../../app/Colors';

export const RenderMessageText = memo((props: MessageTextProps<IMessage>) => {
  const { isDarkMode } = useDarkMode();
  const [message, setMessage] = useState(props.currentMessage as ChatMessageIMessage);
  const deleted = message?.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus;
  const hasMoreTextContent = message?.fileMetadata?.payloads?.some(
    (e) => e.key === DEFAULT_PAYLOAD_KEY
  );
  const { data: completeMessage } = useChatMessagePayload({
    fileId: message.fileId,
    payloadKey: hasMoreTextContent ? DEFAULT_PAYLOAD_KEY : undefined,
  }).getExpanded;

  const allowExpand = hasMoreTextContent && !!completeMessage;
  const content = message?.fileMetadata.appData.content;
  const plainMessage = getPlainTextFromRichText(content.message);
  const onlyEmojis = isEmojiOnly(plainMessage);
  /**
   * An array of parse patterns used for parsing text in the chat detail component.
   * Each pattern consists of a regular expression pattern, a style to apply to the matched text,
   * an onPress function to handle the press event, and a renderText function to customize the rendered text.
   * @param linkStyle The style to apply to the matched text.
   * @returns An array of parse patterns.
   */
  const parsePatterns = useCallback((linkStyle: StyleProp<TextStyle>): ParseShape[] => {
    const pattern = /(^|\s)@[a-zA-Z0-9._-]+(?!@)/;
    return [
      {
        pattern: pattern,
        style: [
          linkStyle,
          {
            textDecorationLine: 'none',
          },
        ],
        onPress: (text: string) => openURL(`https://${text}`),
        renderText: (text: string) => {
          return (<AuthorName odinId={text.slice(1)} showYou={false} />) as unknown as string;
        },
      },
      {
        pattern: URL_PATTERN,
        style: linkStyle,
        onPress: (text: string) => openURL(text),
        onLongPress: (text: string) => {
          Clipboard.setString(text);
          Toast.show({
            type: 'info',
            text1: 'Copied to clipboard',
            position: 'bottom',
          });
        },
      },
    ];
  }, []);

  useEffect(() => {
    if (!completeMessage) {
      setMessage(props.currentMessage as ChatMessageIMessage);
    } else {
      const message = props.currentMessage as ChatMessageIMessage;
      message.text = completeMessage.message;
      setMessage(message);
    }
  }, [completeMessage, props.currentMessage]);

  const onExpand = useCallback(() => {
    if (!hasMoreTextContent || !completeMessage) return;
    const message = props.currentMessage as ChatMessageIMessage;
    message.text = completeMessage.message;
    setMessage(message);
  }, [hasMoreTextContent, completeMessage, props]);

  return (
    <MessageText
      {...props}
      currentMessage={message}
      parsePatterns={parsePatterns}
      linkStyle={{
        left: {
          color: isDarkMode ? Colors.indigo[300] : Colors.indigo[500],
        },
        right: {
          color: isDarkMode ? Colors.violet[100] : Colors.violet[100],
          fontWeight: '500',
        },
      }}
      allowExpand={allowExpand}
      onExpandPress={onExpand}
      customTextStyle={
        onlyEmojis
          ? {
              fontSize: 48,
              lineHeight: 60,
            }
          : deleted
            ? {
                textDecorationLine: 'line-through',
                color: props.position === 'left' ? Colors.gray[500] : Colors.gray[300],
              }
            : undefined
      }
    />
  );
});
