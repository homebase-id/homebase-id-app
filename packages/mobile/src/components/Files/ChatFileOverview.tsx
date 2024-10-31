import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  ViewStyle,
  StyleProp,
  ImageStyle,
  DimensionValue,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Pdf, Play, Plus, SendChat, SubtleCheck, Trash } from '../ui/Icons/icons';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Colors } from '../../app/Colors';
import { Header, HeaderBackButtonProps } from '@react-navigation/elements';
import { BackButton } from '../ui/Buttons';
import { useDarkMode } from '../../hooks/useDarkMode';
import { chatStyles } from '../Chat/ChatDetail';
import { t } from 'homebase-id-app-common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import Video from 'react-native-video';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { ChatStackParamList } from '../../app/ChatStack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { getNewId } from '@homebase-id/js-lib/helpers';
import Toast from 'react-native-toast-message';
import { AuthorName } from '../ui/Name';
import { assetsToImageSource } from '../../utils/utils';
import { grabThumbnail } from '../../provider/video/RNVideoSegmenter';

const FilePreview = ({
  asset,
  style,
  imageStyle,
  size,
  children,
  preview = false,
}: {
  asset: ImageSource;
  style?: StyleProp<ViewStyle>;
  imageStyle?: ImageStyle;
  size?: { width: DimensionValue; height: DimensionValue };
  children?: React.ReactNode;
  preview?: boolean;
}) => {
  const isVideo = asset.type?.startsWith('video') || asset.type === 'application/vnd.apple.mpegurl';
  const isDocument = asset.type?.startsWith('application');
  return (
    <>
      {isVideo ? (
        <View
          style={[
            style,
            {
              overflow: 'hidden',
            },
            size,
          ]}
        >
          <VideoPreview asset={asset} preview={preview} />
          {children}
        </View>
      ) : isDocument ? (
        // If document preview fails we still show an icon. Document preview fails in android but works in ios
        <View
          style={[
            style,
            size,
            {
              position: 'relative',
            },
          ]}
        >
          <Image
            source={{ uri: asset.uri || asset.filepath || undefined }}
            style={[size, imageStyle]}
          />
          <View
            style={[
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
                alignItems: 'center',
                justifyContent: 'flex-end',
              },
            ]}
          >
            <View
              style={{
                paddingVertical: 7,
                backgroundColor: Colors.slate[200],
                width: '100%',
              }}
            >
              <Pdf size={'md'} color={Colors.slate[800]} />
            </View>
          </View>
          {children}
        </View>
      ) : (
        <View style={[style]}>
          <Image
            source={{ uri: asset.uri || asset.filepath || undefined }}
            style={[size, imageStyle]}
          />
          {children}
        </View>
      )}
    </>
  );
};

export const VideoPreview = ({
  asset,
  size,
  preview,
}: {
  asset: ImageSource;
  size?: { width: DimensionValue; height: DimensionValue };
  preview?: boolean;
}) => {
  const isSmallEnough = useMemo(
    () => asset.fileSize && asset.fileSize < 10000000,
    [asset.fileSize]
  );
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isSmallEnough) return;
    grabThumbnail(asset).then((thumb) => {
      setThumbnailUrl(thumb?.uri);
    });
  }, [asset, isSmallEnough]);

  return (
    <>
      {thumbnailUrl ? (
        <>
          <Image
            source={{ uri: thumbnailUrl }}
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                objectFit: !preview ? 'contain' : 'cover',
              },
            ]}
          />
          {!preview ? (
            <View
              style={{
                margin: 'auto',
                zIndex: 100,
                position: 'relative',
              }}
            >
              <Play size={'5xl'} color={Colors.white} />
            </View>
          ) : null}
        </>
      ) : !isSmallEnough ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
          }}
        >
          <ActivityIndicator size="large" color={Colors.white} style={{ margin: 'auto' }} />
        </View>
      ) : (
        <Video
          source={{ uri: asset.uri || asset.filepath || undefined }}
          style={[
            size,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
            },
          ]}
          onError={(error) => console.error(error)}
          resizeMode={preview ? 'cover' : 'contain'}
          controls={!preview}
          paused
        />
      )}

      {preview && (
        <View
          style={{
            marginVertical: 'auto',
            zIndex: 100,
            position: 'relative',
          }}
        >
          <Play size={'md'} color={Colors.white} />
        </View>
      )}
    </>
  );
};

export type ChatFileOverviewProp = NativeStackScreenProps<ChatStackParamList, 'ChatFileOverview'>;

export const ChatFileOverview = memo(
  ({
    navigation,
    route: {
      params: { initialAssets, recipients, title },
    },
  }: ChatFileOverviewProp) => {
    const [messageInput, setIsMessageInput] = useState(false);
    const [message, setMessage] = useState('');
    const { isDarkMode } = useDarkMode();
    const [assets, setAssets] = useState(initialAssets);
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentAsset = assets[currentIndex];
    const { bottom: bottomInsets } = useSafeAreaInsets();
    const { colors } = useTheme();
    const { mutate: sendMessage } = useChatMessage().send;

    const onSend = useCallback(() => {
      recipients.forEach((recipient) => {
        sendMessage({
          conversation: recipient,
          message: message,
          files: assets,
          chatId: getNewId(),
          userDate: new Date().getTime(),
        });
      });

      if (recipients.length > 1) {
        navigation.pop();
        Toast.show({
          type: 'info',
          text1: 'Sending Messages',
          position: 'bottom',
        });
        return;
      } else {
        navigation.navigate('ChatScreen', {
          convoId: recipients[0].fileMetadata.appData.uniqueId as string,
        });
        return;
      }
    }, [assets, message, navigation, recipients, sendMessage]);

    const headerLeft = useCallback(
      (props: HeaderBackButtonProps) => {
        return BackButton({
          onPress: () => navigation.goBack(),
          prop: props,
          showArrow: true,
          label: ' ',
        });
      },
      [navigation]
    );

    const doAppendAssets = useCallback(async () => {
      const medias = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 10,
        formatAsMp4: true,
        includeExtra: true,
      });
      if (medias.didCancel) return;

      const newAssets: ImageSource[] = medias.assets ? assetsToImageSource(medias.assets) : [];

      setAssets((assets) => [...assets, ...newAssets]);
    }, [setAssets]);

    return (
      <Animated.View
        entering={SlideInDown}
        exiting={SlideOutDown}
        style={{
          flex: 1,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'pink',
          }}
        >
          <Header title={title || 'Share'} headerLeft={headerLeft} />
          <FilePreview
            asset={currentAsset}
            style={{
              flexShrink: 1,
              alignItems: 'flex-end',
              padding: 4,
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
            }}
            imageStyle={{
              objectFit: 'contain',
            }}
            size={{ width: Dimensions.get('window').width, height: '100%' }}
          />

          <ScrollView
            horizontal
            contentContainerStyle={{
              gap: 0,
            }}
            showsHorizontalScrollIndicator={false}
            style={{
              marginTop: -38,
              height: 54, // 48 + 3 * 2 (border width)
              flexShrink: 0,
              paddingHorizontal: 3,
              // backgroundColor: isDarkMode ? Colors.black : Colors.white,
            }}
          >
            {assets.map((value, index) => {
              return (
                <FilePreview
                  key={index}
                  asset={value}
                  preview={value.type?.startsWith('video') ?? false}
                  size={{
                    width: 48,
                    height: 48,
                  }}
                  style={{
                    borderWidth: 3,
                    borderRadius: 15,
                    borderColor: currentIndex === index ? Colors.indigo[400] : '',
                  }}
                  imageStyle={{
                    objectFit: 'cover',
                    aspectRatio: 1,
                    borderRadius: 11,
                  }}
                >
                  {assets.length > 1 && index === currentIndex ? (
                    <TouchableOpacity
                      onPress={() => {
                        setAssets(assets.filter((_, i) => i !== index));
                        if (currentIndex === assets.length - 1) {
                          setCurrentIndex(currentIndex - 1);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        left: 0,
                        bottom: 0,
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        justifyContent: 'center',
                        backgroundColor: `${Colors.slate[900]}4A`,
                      }}
                    >
                      <Trash size={'sm'} color={Colors.white} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setCurrentIndex(index)}
                      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                    />
                  )}
                </FilePreview>
              );
            })}
            <View
              style={{
                borderWidth: 3,
                borderColor: 'transparent',
              }}
            >
              <TouchableOpacity
                onPress={doAppendAssets}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[200],
                }}
              >
                <Plus size={'md'} color={Colors.indigo[400]} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View
            style={{
              paddingTop: 10,
              paddingBottom: Platform.select({
                android: 7,
                ios: bottomInsets,
              }),
              flexDirection: 'column',
              paddingHorizontal: 0,
              marginTop: 10,
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setIsMessageInput(true)}
              style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 8 }}
            >
              <Text
                style={[
                  {
                    color: isDarkMode ? Colors.white : Colors.black,
                    fontSize: 16,
                  },
                  message
                    ? {
                        borderRadius: 20,
                        overflow: 'hidden',
                        backgroundColor: isDarkMode ? Colors.slate[800] : Colors.indigo[50],
                        flex: 1,
                        padding: 10,
                      }
                    : {
                        fontWeight: '500',
                        paddingTop: 6,
                      },
                  messageInput ? { opacity: 0 } : {},
                ]}
              >
                {message || t('Add message')}
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                paddingHorizontal: 7,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: 5,
                  flex: 1,
                  marginLeft: 12,
                  overflow: 'hidden',
                  flexWrap: 'wrap',
                }}
              >
                {recipients.map((group) => {
                  const isSingleConversation =
                    group.fileMetadata.appData.content.recipients.length === 2;
                  return (
                    <Text
                      key={group.fileId}
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        borderRadius: 15,
                        backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
                        color: isDarkMode ? Colors.white : Colors.black,
                        padding: 10,
                        overflow: 'hidden',
                      }}
                    >
                      {!isSingleConversation ? (
                        group.fileMetadata.appData.content.title
                      ) : (
                        <AuthorName odinId={group.fileMetadata.appData.content.recipients[0]} />
                      )}
                    </Text>
                  );
                })}
              </View>
              <TouchableOpacity onPress={onSend} style={chatStyles.send}>
                <View
                  style={{
                    transform: [
                      {
                        rotate: '50deg',
                      },
                    ],
                  }}
                >
                  <SendChat size={'md'} color={Colors.white} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {messageInput && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                flex: 1,
                justifyContent: 'flex-end',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onPress={() => setIsMessageInput(false)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                  backgroundColor: isDarkMode ? colors.card : Colors.slate[50],
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 7,
                    paddingTop: 10,
                    // height: 120,
                    paddingBottom: Platform.select({
                      ios: 7,
                      android: 12,
                    }),
                  }}
                >
                  <View
                    style={{
                      borderRadius: 20,
                      borderWidth: 0,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      backgroundColor: isDarkMode ? Colors.slate[800] : Colors.indigo[50],
                      flex: 1,
                      alignItems: 'center',
                      flexDirection: 'row',
                    }}
                  >
                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      placeholder={t('Type a message...')}
                      style={{
                        flex: 1,
                        maxHeight: 80,
                        color: isDarkMode ? Colors.white : Colors.black,
                        paddingVertical: 8,
                      }}
                      autoFocus={messageInput}
                      multiline
                      textAlignVertical="center" // Android only
                      autoCapitalize="sentences"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsMessageInput(false)}
                    style={chatStyles.send}
                  >
                    <SubtleCheck size={'md'} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  }
);
