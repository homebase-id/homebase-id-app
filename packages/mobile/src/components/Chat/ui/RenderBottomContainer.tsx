import { memo, useEffect } from 'react';
import { useDarkMode } from '../../../hooks/useDarkMode';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ImageLibrary, PaperClip } from '../../ui/Icons/icons';
import { Colors } from '../../../app/Colors';
import { Platform, View } from 'react-native';
import { Text } from '../../ui/Text/Text';
import { BaseButton } from 'react-native-gesture-handler';

export const RenderBottomContainer = memo(
  ({
    isVisible,
    onGalleryPressed,
    onAttachmentPressed,
  }: {
    isVisible?: boolean;
    onGalleryPressed: () => void;
    onAttachmentPressed: () => void;
  }) => {
    const { isDarkMode } = useDarkMode();
    const height = useSharedValue(0);
    useEffect(() => {
      if (isVisible) {
        height.value = 250;
      } else {
        height.value = 0;
      }
    }, [height, isVisible]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        height: withTiming(height.value, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        opacity: withTiming(height.value > 0 ? 1 : 0, { duration: 300 }),
      };
    });

    return (
      <Animated.View
        style={[
          animatedStyle,
          {
            height: Platform.select({
              ios: 250,
            }),
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          },
        ]}
      >
        <MediaPickerComponent icon={<ImageLibrary />} onPress={onGalleryPressed} title="Gallery" />
        <MediaPickerComponent
          icon={<PaperClip />}
          onPress={onAttachmentPressed}
          title="Attachment"
        />
      </Animated.View>
    );
  }
);

const MediaPickerComponent = ({
  icon,
  onPress,
  title,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  title: string;
}) => {
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      <BaseButton
        onPress={onPress}
        rippleColor={isDarkMode ? Colors.indigo[900] : Colors.indigo[300]}
        style={{
          padding: 18,
          borderRadius: 10,
          backgroundColor: isDarkMode ? Colors.indigo[800] : Colors.indigo[200],
          margin: 10,
        }}
      >
        {icon}
      </BaseButton>
      <Text>{title}</Text>
    </View>
  );
};
