import { createContext, memo, ReactNode } from 'react';
import { useChatSettings } from '../../hooks/chat/useChatSettings';

export const ChatSettingsContext = createContext<{
  allowYoutubePlayback: boolean;
  setAllowYoutubePlayback: (allow: boolean) => void;
} | null>(null);

const ChatSettingsProvider = memo(({ children }: { children: ReactNode }) => {
  const { allowYoutubePlayback, setYoutubePlayback } = useChatSettings();

  return (
    <ChatSettingsContext.Provider
      value={{ allowYoutubePlayback, setAllowYoutubePlayback: setYoutubePlayback }}
    >
      {children}
    </ChatSettingsContext.Provider>
  );
});

export default ChatSettingsProvider;
