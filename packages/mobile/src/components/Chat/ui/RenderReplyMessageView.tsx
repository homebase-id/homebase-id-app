import { HomebaseFile } from '@homebase-id/js-lib/core';
import { memo } from 'react';
import { Pressable, View, Text } from 'react-native';
import { BubbleProps } from 'react-native-gifted-chat';
import { getOdinIdColor, Colors } from '../../../app/Colors';
import { useChatMessage } from '../../../hooks/chat/useChatMessage';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { ChatMessage } from '../../../provider/chat/ChatProvider';
import { ChatDrive } from '../../../provider/chat/ConversationProvider';
import { ConnectionName } from '../../ui/Name';
import { OdinImage } from '../../ui/OdinImage/OdinImage';
import { ChatMessageContent } from '../Chat-Message-Content';
import { ChatMessageIMessage, chatStyles } from '../ChatDetail';

export const RenderReplyMessageView = memo(
  (
    props: BubbleProps<ChatMessageIMessage> & {
      onReplyPress: (message: HomebaseFile<ChatMessage> | null | undefined) => void;
    }
  ) => {
    const { data: replyMessage } = useChatMessage({
      conversationId: props.currentMessage?.fileMetadata.appData.groupId,
      messageId: props.currentMessage?.fileMetadata.appData.content.replyId,
    }).get;
    const { isDarkMode } = useDarkMode();

    if (!props.currentMessage?.fileMetadata.appData.content.replyId) return null;
    const color = getOdinIdColor(replyMessage?.fileMetadata.senderOdinId || '');

    return (
      props.currentMessage &&
      props.currentMessage.fileMetadata.appData.content.replyId && (
        <Pressable onPress={() => props.onReplyPress(replyMessage)}>
          <View
            style={[
              chatStyles.replyMessageContainer,
              {
                borderLeftColor:
                  props.position === 'left' ? color.color(isDarkMode) : Colors.purple[500],
                backgroundColor: `${Colors.indigo[500]}1A`,
              },
            ]}
          >
            <View style={chatStyles.replyText}>
              {replyMessage ? (
                <>
                  <Text
                    style={{
                      fontWeight: '600',
                      fontSize: 15,
                      color: color.color(props.position === 'right' ? true : isDarkMode),
                    }}
                  >
                    {replyMessage?.fileMetadata.senderOdinId?.length > 0 ? (
                      <ConnectionName odinId={replyMessage?.fileMetadata.senderOdinId} />
                    ) : (
                      'You'
                    )}
                  </Text>
                  <Text
                    numberOfLines={3}
                    style={{
                      fontSize: 14,
                      marginTop: 4,
                      color:
                        props.position === 'right'
                          ? Colors.slate[300]
                          : isDarkMode
                            ? Colors.slate[300]
                            : Colors.slate[900],
                    }}
                  >
                    <ChatMessageContent {...replyMessage} />
                  </Text>
                </>
              ) : (
                <Text
                  style={{
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: isDarkMode ? Colors.slate[400] : Colors.slate[600],
                  }}
                >
                  Message not found
                </Text>
              )}
            </View>
            {replyMessage &&
              replyMessage.fileMetadata.payloads &&
              replyMessage.fileMetadata.payloads?.length > 0 &&
              replyMessage.fileMetadata.payloads[0].contentType.startsWith('image') && (
                <OdinImage
                  fileId={replyMessage.fileId}
                  targetDrive={ChatDrive}
                  fileKey={replyMessage.fileMetadata.payloads[0].key}
                  previewThumbnail={replyMessage.fileMetadata.appData.previewThumbnail}
                  avoidPayload={true}
                  enableZoom={false}
                  style={{
                    flex: 1,
                  }}
                  imageSize={{
                    width: 60,
                    height: 60,
                  }}
                />
              )}
          </View>
        </Pressable>
      )
    );
  }
);
