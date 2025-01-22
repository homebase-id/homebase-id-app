import { DotYouClient } from '@homebase-id/js-lib/core';
import { useContext, createContext } from 'react';

export const DotYouClientContext = createContext<DotYouClient | null>(null);

export const useDotYouClientContext = () => {
  const dotYouClient = useContext(DotYouClientContext);
  if (!dotYouClient) throw new Error('DotYouClientContext not found');

  return dotYouClient;
};
