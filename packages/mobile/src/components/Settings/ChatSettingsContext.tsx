import { createContext, memo, ReactNode } from 'react';
import { useChatSettings } from '../../hooks/chat/useChatSettings';
import type { ListImplementationType } from 'react-native-gifted-chat/lib/MessageContainerSwitch';

export const ChatSettingsContext = createContext<{
  allowYoutubePlayback: boolean;
  setAllowYoutubePlayback: (allow: boolean) => void;
  listImplementation: ListImplementationType;
  setListImplementation: (type: ListImplementationType) => void;
} | null>(null);

const ChatSettingsProvider = memo(({ children }: { children: ReactNode }) => {
  const { allowYoutubePlayback, setYoutubePlayback, listImplementation, setListType } =
    useChatSettings();

  return (
    <ChatSettingsContext.Provider
      value={{
        allowYoutubePlayback,
        setAllowYoutubePlayback: setYoutubePlayback,
        listImplementation,
        setListImplementation: setListType,
      }}
    >
      {children}
    </ChatSettingsContext.Provider>
  );
});

export default ChatSettingsProvider;
