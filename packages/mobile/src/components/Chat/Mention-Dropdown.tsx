import { memo, useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useConversation } from '../../hooks/chat/useConversation';
import IdentityItem from '../list/identityItem';
import { TouchableOpacity } from 'react-native-gesture-handler';

export type MentionDropDownProps = {
  isVisible: boolean;
  currentText: string;
  conversationId: string;
  onMention?: (mention: string) => void;
};

export const MentionDropDown = memo(
  ({ isVisible, conversationId, onMention }: MentionDropDownProps) => {
    const { data: conversation } = useConversation({ conversationId }).single;
    const recipients: string[] = conversation?.fileMetadata?.appData?.content?.recipients ?? [];
    const height = useSharedValue(0);

    useEffect(() => {
      const newHeight = isVisible ? 200 : 0;
      height.value = withTiming(newHeight, {
        duration: 150,
        easing: Easing.inOut(Easing.sin),
      });
    }, [height, isVisible]);

    const style = useAnimatedStyle(() => {
      return {
        height: height.value,
        zIndex: 10,
      };
    });

    if (!recipients) return null;

    return (
      <Animated.FlatList
        style={style}
        data={recipients}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onMention?.(item)}>
            <IdentityItem odinId={item} />
          </TouchableOpacity>
        )}
      />
    );
  }
);
