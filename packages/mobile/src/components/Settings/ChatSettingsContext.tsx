import { createContext, memo, ReactNode } from 'react';
import { useChatSettings } from '../../hooks/chat/useChatSettings';

export const ChatSettingsContext = createContext<{
  allowYoutubePlayback: boolean;
  setAllowYoutubePlayback: (allow: boolean) => void;
} | null>(null);

const ChatSettingsProvider = memo(({ children }: { children: ReactNode }) => {
  const { allowYoutubePlayback, setAllowYoutubePlayback } = useChatSettings();

  return (
    <ChatSettingsContext.Provider value={{ allowYoutubePlayback, setAllowYoutubePlayback }}>
      {children}
    </ChatSettingsContext.Provider>
  );
});

export default ChatSettingsProvider;
