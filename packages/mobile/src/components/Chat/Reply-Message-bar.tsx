import { Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Close, Reply } from '../ui/Icons/icons';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { Colors, getOdinIdColor } from '../../app/Colors';
import { OdinImage } from '../ui/OdinImage/OdinImage';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatMessageIMessage } from './ChatDetail';

import { ChatMessageContent } from './Chat-Message-Content';
import { AuthorName } from '../ui/Name';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect, useMemo } from 'react';

type ReplyMessageBarProps = {
  clearReply: () => void;
  message: ChatMessageIMessage | null;
};

const ReplyMessageBar = ({ clearReply, message }: ReplyMessageBarProps) => {
  const { isDarkMode } = useDarkMode();
  const height = useSharedValue(0);

  const payloads = message?.fileMetadata?.payloads;
  const isImageOrVideo = useMemo(
    () =>
      payloads?.some(
        (payload) => payload.contentType.includes('image') || payload.contentType.includes('video')
      ) || false,
    [payloads]
  );

  const color = getOdinIdColor(message?.user._id as string);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      paddingVertical: message ? 8 : 0,
      borderBottomWidth: message ? 1 : 0,
    };
  });

  useEffect(() => {
    const newHeight = message ? 50 : 0;
    height.value = withTiming(newHeight, {
      duration: message ? 300 : 150,
      easing: Easing.inOut(Easing.ease),
    });
  }, [height, message]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {message && (
        <>
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
              <AuthorName odinId={message.fileMetadata.senderOdinId} showYou />
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
          {payloads && payloads?.length > 0 && isImageOrVideo && (
            <OdinImage
              fileId={message.fileId}
              targetDrive={ChatDrive}
              previewThumbnail={message.fileMetadata.appData.previewThumbnail}
              fileKey={payloads[0].key}
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
        </>
      )}
    </Animated.View>
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
    alignSelf: 'flex-end',
  },
  messageContainer: {
    flexGrow: 1,
  },
});
