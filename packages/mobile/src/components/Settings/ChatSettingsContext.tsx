import { createContext, memo, ReactNode } from 'react';
import { useChatSettings } from '../../hooks/chat/useChatSettings';

export const ChatSettingsContext = createContext<{
  allowYoutubePlayback: boolean;
  setAllowYoutubePlayback: (allow: boolean) => void;
  useLegendList: boolean;
  setUseLegendList: (useLegend: boolean) => void;
} | null>(null);

const ChatSettingsProvider = memo(({ children }: { children: ReactNode }) => {
  const { allowYoutubePlayback, setYoutubePlayback, useLegendList, setLegendListUsage } =
    useChatSettings();

  return (
    <ChatSettingsContext.Provider
      value={{
        allowYoutubePlayback,
        setAllowYoutubePlayback: setYoutubePlayback,
        useLegendList,
        setUseLegendList: setLegendListUsage,
      }}
    >
      {children}
    </ChatSettingsContext.Provider>
  );
});

export default ChatSettingsProvider;
