import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUBBLE_COLORS, ChatColor } from '../../utils/bubble_colors';

const CHAT_BUBBLE_COLOR_KEY = 'bubbleColor';

export const useChatBubbleColor = () => {

    function setChatColor(color: ChatColor) {
        AsyncStorage.setItem(CHAT_BUBBLE_COLOR_KEY, color.id);
        return color;
    }
    async function getChatColor() {
        const colorId = await AsyncStorage.getItem(CHAT_BUBBLE_COLOR_KEY);
        if (colorId) {
            const index = BUBBLE_COLORS.findIndex((val) => val.id === colorId);
            if (index !== -1) {
                return BUBBLE_COLORS[index];
            }
        }
        return BUBBLE_COLORS[0];

    }


    return { getChatColor, setChatColor };
};
