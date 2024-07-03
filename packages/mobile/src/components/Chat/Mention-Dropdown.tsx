import { memo, useEffect, useState } from 'react';
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
  query: string;
  conversationId: string;
  onMention?: (mention: string) => void;
};

export const MentionDropDown = memo(
  ({ conversationId, onMention, query }: MentionDropDownProps) => {
    const { data: conversation } = useConversation({ conversationId }).single;
    const recipients: string[] = conversation?.fileMetadata?.appData?.content?.recipients ?? [];
    const height = useSharedValue(0);
    const [isVisible, setIsVisible] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');

    useEffect(() => {
      // Detect if @ is the last character and it's a new word
      const lastChar = query.slice(-1);
      const words = query.split(' ');
      const lastWord = words[words.length - 1];
      // if starts with @ and has more than 1 character
      if (lastChar === '@') {
        setIsVisible(true);
        setMentionQuery('');
      } else if (isVisible) {
        if (lastWord.startsWith('@')) {
          setMentionQuery(lastWord.slice(1));
        } else {
          setIsVisible(false);
        }
      }
    }, [isVisible, query]);

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
