import { createContext, memo, ReactNode } from 'react';
import { ChatColor } from '../../utils/bubble_colors';
import { useChatBubbleColor } from '../../hooks/chat/useChatBubbleColor';

export const BubbleColorContext = createContext<{
  bubbleColor: ChatColor;
  setBubbleColor: (color: ChatColor) => void;
} | null>(null);

const BubbleColorProvider = memo(({ children }: { children: ReactNode }) => {
  const { chatColor, setChatColor } = useChatBubbleColor();

  return (
    <BubbleColorContext.Provider value={{ bubbleColor: chatColor, setBubbleColor: setChatColor }}>
      {children}
    </BubbleColorContext.Provider>
  );
});

export default BubbleColorProvider;
