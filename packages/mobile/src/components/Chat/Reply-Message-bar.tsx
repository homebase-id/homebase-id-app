import { Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Close, Reply } from '../ui/Icons/icons';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { Colors, getOdinIdColor } from '../../app/Colors';
import { OdinImage } from '../ui/OdinImage/OdinImage';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatMessageIMessage } from './ChatDetail';

import { ChatMessageContent } from './Chat-Message-Content';
import { useMemo } from 'react';
import { ConnectionName } from '../ui/Name';

type ReplyMessageBarProps = {
  clearReply: () => void;
  message: ChatMessageIMessage;
};

const ReplyMessageBar = ({ clearReply, message }: ReplyMessageBarProps) => {
  const { isDarkMode } = useDarkMode();
  const { payloads } = message.fileMetadata;
  const isImageOrVideo = useMemo(
    () =>
      payloads.some(
        (payload) => payload.contentType.includes('image') || payload.contentType.includes('video')
      ),
    [payloads]
  );
  const color = getOdinIdColor(message.user._id as string);

  return (
    <View style={styles.container}>
      <View style={styles.replyImageContainer}>
        <Reply />
      </View>

      <View style={styles.messageContainer}>
        <Text
          style={{
            color: color.color(isDarkMode),
            fontWeight: '600',
            fontSize: 14,
          }}
        >
          {message.fileMetadata.senderOdinId.length > 0 ? (
            <ConnectionName odinId={message.fileMetadata.senderOdinId} />
          ) : (
            'You'
          )}
        </Text>
        <Text
          numberOfLines={3}
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          <ChatMessageContent {...message} />
        </Text>
      </View>
      {payloads?.length > 0 && isImageOrVideo && (
        <OdinImage
          fileId={message.fileId}
          targetDrive={ChatDrive}
          previewThumbnail={message.fileMetadata.appData.previewThumbnail}
          fileKey={message.fileMetadata.payloads[0].key}
          fit="cover"
          imageSize={{
            width: 45,
            height: 45,
          }}
          enableZoom={false}
        />
      )}
      <TouchableOpacity style={styles.crossButton} onPress={clearReply}>
        <Close />
      </TouchableOpacity>
    </View>
  );
};

export default ReplyMessageBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate[200],
    height: 50,
  },
  replyImage: {
    width: 20,
    height: 20,
  },
  replyImageContainer: {
    paddingLeft: 8,
    paddingRight: 6,
    borderRightWidth: 2,
    borderRightColor: Colors.indigo[500],
    marginRight: 6,
    height: '100%',
    justifyContent: 'center',
  },
  crossButtonIcon: {
    width: 24,
    height: 24,
  },
  crossButton: {
    padding: 4,
  },
  messageContainer: {
    flex: 1,
  },
});
