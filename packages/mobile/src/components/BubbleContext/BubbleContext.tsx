import { createContext, memo, ReactNode, useCallback, useEffect, useState } from 'react';
import { BUBBLE_COLORS, ChatColor } from '../../utils/bubble_colors';
import { useChatBubbleColor } from '../../hooks/chat/useChatBubbleColor';

export const BubbleColorContext = createContext<{
  bubbleColor: ChatColor;
  setBubbleColor: (color: ChatColor) => void;
} | null>(null);

const BubbleColorProvider = memo(({ children }: { children: ReactNode }) => {
  const { getChatColor, setChatColor } = useChatBubbleColor();
  const [color, setColor] = useState<ChatColor>(BUBBLE_COLORS[0]);

  useEffect(() => {
    (async () => {
      const bubbleColor = await getChatColor();
      setColor(bubbleColor);
    })();
  }, [getChatColor]);

  const setBubbleColor = useCallback(
    (color: ChatColor) => {
      setChatColor(color);
      setColor(color);
    },
    [setChatColor]
  );

  return (
    <BubbleColorContext.Provider value={{ bubbleColor: color, setBubbleColor }}>
      {children}
    </BubbleColorContext.Provider>
  );
});

export default BubbleColorProvider;
