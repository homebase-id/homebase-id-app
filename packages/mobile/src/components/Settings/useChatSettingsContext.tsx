import { useContext } from 'react';
import { ChatSettingsContext } from './ChatSettingsContext';

export const useChatSettingsContext = () => {
  const chatSettings = useContext(ChatSettingsContext);
  if (!chatSettings) throw new Error('BubbleColorContext not found');

  return chatSettings;
};
