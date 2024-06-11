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
import { Asset } from 'react-native-image-picker';
import { Close, Pdf, Play, SendChat, SubtleCheck } from '../ui/Icons/icons';
import { memo, useCallback, useState } from 'react';
import { Colors } from '../../app/Colors';
import { Header, HeaderBackButtonProps } from '@react-navigation/elements';
import { BackButton } from '../ui/convo-app-bar';
import { useDarkMode } from '../../hooks/useDarkMode';
import { chatStyles } from '../Chat/ChatDetail';
import { t } from 'feed-app-common';

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

export const ChatFileOverview = memo(
  ({
    title,
    assets,
    setAssets,
    doSend,
  }: {
    title?: string;
    assets: Asset[];
    setAssets: (newAssets: Asset[]) => void;
    doSend: (message: { text: string }[]) => void;
  }) => {
    const [messageInput, setIsMessageInput] = useState(false);
    const [message, setMessage] = useState('');
    const { isDarkMode } = useDarkMode();
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentAsset = assets[currentIndex];

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
              height: 76, // 70 + 3 * 2 (border width)
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
                    width: 70,
                    height: 70,
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
                      style={{ position: 'absolute', top: 4, right: 4 }}
                    >
                      <Close size={'sm'} color="white" />
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
          </ScrollView>

          <View
            style={{
              paddingVertical: 10,
              flexDirection: 'column',
              paddingHorizontal: 0,
              marginTop: 10,
              gap: 10,
              backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[50],
            }}
          >
            <TouchableOpacity
              onPress={() => setIsMessageInput(true)}
              style={{ flexDirection: 'row', justifyContent: 'center' }}
            >
              <Text
                style={[
                  {
                    color: isDarkMode ? Colors.white : Colors.black,
                  },
                  message
                    ? {
                        borderRadius: 20,
                        overflow: 'hidden',
                        backgroundColor: isDarkMode ? Colors.slate[800] : Colors.indigo[50],
                        flex: 1,
                        padding: 10,
                      }
                    : {},
                  messageInput ? { opacity: 0 } : {},
                ]}
              >
                {message || t('Add message')}
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => doSend([{ text: message }])} style={chatStyles.send}>
                <SendChat size={'md'} color={Colors.white} />
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
                  backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[50],
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 3,
                  }}
                >
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder={t('Type a message...')}
                    style={{
                      flex: 1,
                      borderRadius: 20,
                      borderWidth: 0,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      backgroundColor: isDarkMode ? Colors.slate[800] : Colors.indigo[50],
                      flexDirection: 'row',
                      color: isDarkMode ? Colors.white : Colors.black,
                    }}
                    autoFocus={messageInput}
                    multiline
                    textAlignVertical="center" // Android only
                  />
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
