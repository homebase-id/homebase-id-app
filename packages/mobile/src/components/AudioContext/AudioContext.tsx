import { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export const AudioContext = createContext<{
  audioPath: string | null;
  setAudioPath: Dispatch<SetStateAction<string | null>>;
} | null>(null);

export const AudioContextProvider = ({ children }: { children: ReactNode }) => {
  const [audioPath, setAudioPath] = useState<string | null>(null);

  return (
    <AudioContext.Provider value={{ audioPath, setAudioPath }}>{children}</AudioContext.Provider>
  );
};
