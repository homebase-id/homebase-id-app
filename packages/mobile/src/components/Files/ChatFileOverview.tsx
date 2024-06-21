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
} from 'react-native';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { Pdf, Play, Plus, SendChat, SubtleCheck, Trash } from '../ui/Icons/icons';
import { memo, useCallback, useState } from 'react';
import { Colors } from '../../app/Colors';
import { Header, HeaderBackButtonProps } from '@react-navigation/elements';
import { BackButton } from '../ui/convo-app-bar';
import { useDarkMode } from '../../hooks/useDarkMode';
import { chatStyles } from '../Chat/ChatDetail';
import { t } from 'feed-app-common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';

const FilePreview = ({
  asset,
  style,
  imageStyle,
  size,
  children,
}: {
  asset: Asset;
  style?: StyleProp<ViewStyle>;
  imageStyle?: ImageStyle;
  size?: { width: DimensionValue; height: DimensionValue };
  children?: React.ReactNode;
}) => {
  const isVideo = asset.type?.startsWith('video') ?? false;
  const isDocument = asset.type?.startsWith('application') ?? false;

  return (
    <>
      {isVideo ? (
        <View
          style={[
            {
              backgroundColor: Colors.slate[200],

              alignItems: 'center',
              justifyContent: 'center',
            },
            size,
          ]}
        >
          <Play size={'md'} color={Colors.slate[800]} />
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
          <Image source={{ uri: asset.uri || asset.originalPath }} style={[size, imageStyle]} />
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
          <Image source={{ uri: asset.uri || asset.originalPath }} style={[size, imageStyle]} />
          {children}
        </View>
      )}
    </>
  );
};

// Perhaps convert this to a route
export const ChatFileOverview = memo(
  ({
    title,
    assets,
    setAssets,
    doSend,
  }: {
    title?: string;
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
    doSend: (message: { text: string }[]) => void;
  }) => {
    const [messageInput, setIsMessageInput] = useState(false);
    const [message, setMessage] = useState('');
    const { isDarkMode } = useDarkMode();
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentAsset = assets[currentIndex];
    const { bottom: bottomInsets } = useSafeAreaInsets();
    const { colors } = useTheme();

    const headerLeft = useCallback(
      (props: HeaderBackButtonProps) => {
        return BackButton({
          onPress: () => setAssets([]),
          prop: props,
          showArrow: true,
          label: ' ',
        });
      },
      [setAssets]
    );

    const doAppendAssets = useCallback(async () => {
      const medias = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 10,
        formatAsMp4: true,
        includeExtra: true,
      });
      if (medias.didCancel) return;

      // Keep assets without a type out of it.. We're never sure what it is...
      setAssets((assets) => [...assets, ...(medias.assets?.filter((asset) => asset.type) ?? [])]);
    }, [setAssets]);

    return (
      <>
        <View
          style={{
            flex: 1,
            backgroundColor: 'pink',
          }}
        >
          <Header title={title || ''} headerLeft={headerLeft} />
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
                  size={{
                    width: 48,
                    height: 48,
                  }}
                  style={{
                    borderWidth: 3,
                    borderRadius: 15,
                    borderColor: currentIndex === index ? Colors.indigo[400] : 'transparent',
                  }}
                  imageStyle={{
                    objectFit: 'cover',
                    aspectRatio: 1,
                    borderRadius: 11,
                  }}
                >
                  {index === currentIndex ? (
                    <TouchableOpacity
                      onPress={() => setAssets(assets.filter((_, i) => i !== index))}
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
              style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 7 }}
            >
              <TouchableOpacity onPress={() => doSend([{ text: message }])} style={chatStyles.send}>
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
      </>
    );
  }
);
