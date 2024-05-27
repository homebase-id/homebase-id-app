import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUBBLE_COLORS, ChatColor } from '../../utils/bubble_colors';
import { useEffect, useState } from 'react';

const CHAT_BUBBLE_COLOR_KEY = 'bubbleColor';

export const useChatBubbleColor = () => {
    const [bubbleColor, setBubbleColor] = useState<ChatColor>();
    function setColor(color: ChatColor) {
        setBubbleColor(color);
        AsyncStorage.setItem(CHAT_BUBBLE_COLOR_KEY, color.id);
    }
    async function getColor() {
        const colorId = await AsyncStorage.getItem(CHAT_BUBBLE_COLOR_KEY);
        if (colorId) {
            const index = BUBBLE_COLORS.findIndex((val) => val.id === colorId);
            if (index !== -1) {
                setBubbleColor(BUBBLE_COLORS[index]);
                return;
            }

        }
        setBubbleColor(BUBBLE_COLORS[0]);
    }

    // Run for the first time
    useEffect(() => {
        getColor();
    }, []);

    return { bubbleColor, setColor };
};
