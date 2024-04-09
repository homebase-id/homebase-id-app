import { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export const RouteContext = createContext<{
  routeName: string | null;
  setRouteName: Dispatch<SetStateAction<string | null>>;
} | null>(null);

export const RouteContextProvider = ({ children }: { children: ReactNode }) => {
  const [routeName, setRouteName] = useState<string | null>(null);

  return (
    <RouteContext.Provider value={{ routeName, setRouteName }}>{children}</RouteContext.Provider>
  );
};

import { useContext } from 'react';

export const useRouteContext = () => {
  const audioContext = useContext(RouteContext);
  if (!audioContext) throw new Error('RouteContext not found');

  return audioContext;
};
