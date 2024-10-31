import { DotYouClientContext } from 'homebase-id-app-common';
import { ReactNode, useMemo } from 'react';
import { useAuth } from '../../hooks/auth/useAuth';

export const DotYouClientProvider = ({ children }: { children: ReactNode }) => {
  const { getDotYouClient, isAuthenticated } = useAuth();
  const dotYouClient = useMemo(getDotYouClient, [getDotYouClient, isAuthenticated]);

  return (
    <DotYouClientContext.Provider value={dotYouClient}>{children}</DotYouClientContext.Provider>
  );
};
