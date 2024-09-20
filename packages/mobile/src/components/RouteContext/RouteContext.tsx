import { Route } from '@react-navigation/native';
import { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

export const RouteContext = createContext<{
  route: Route<string> | null;
  setRoute: Dispatch<SetStateAction<Route<string> | null>>;
} | null>(null);

export const RouteContextProvider = ({ children }: { children: ReactNode }) => {
  const [route, setRoute] = useState<Route<string> | null>(null);

  return (
    <ErrorBoundary>
      <RouteContext.Provider value={{ route: route, setRoute: setRoute }}>
        {children}
      </RouteContext.Provider>
    </ErrorBoundary>
  );
};

import { useContext } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary/ErrorBoundary';

export const useRouteContext = () => {
  const routeContext = useContext(RouteContext);
  if (!routeContext) throw new Error('RouteContext not found');

  return routeContext;
};
