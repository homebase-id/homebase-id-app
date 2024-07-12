import { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export const WebSocketContext = createContext<{
  isOnline: boolean | null;
  setIsOnline: Dispatch<SetStateAction<boolean | null>>;
} | null>(null);

export const WebSocketContextProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  return (
    <WebSocketContext.Provider value={{ isOnline, setIsOnline }}>
      {children}
    </WebSocketContext.Provider>
  );
};
