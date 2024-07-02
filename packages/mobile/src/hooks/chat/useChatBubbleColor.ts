import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUBBLE_COLORS, ChatColor } from '../../utils/bubble_colors';
import { useEffect, useState } from 'react';

const CHAT_BUBBLE_COLOR_KEY = 'bubbleColor';

export const useChatBubbleColor = () => {
  const [color, setColor] = useState<ChatColor | undefined>(undefined);

  // Fetching default value
  useEffect(() => {
    (async () => {
      const colorId = await AsyncStorage.getItem(CHAT_BUBBLE_COLOR_KEY);
      setColor(BUBBLE_COLORS.find((val) => colorId && val.id === colorId) || BUBBLE_COLORS[0]);
    })();
  }, []);

  // When state changes, save to AsyncStorage
  useEffect(() => {
    (async () => {
      if (!color) return;
      await AsyncStorage.setItem(CHAT_BUBBLE_COLOR_KEY, color.id);
    })();
  }, [color]);

  return { chatColor: color || BUBBLE_COLORS[0], setChatColor: setColor };
};
