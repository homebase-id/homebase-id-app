import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'feed-app-common';
import {
  OdinErrorDetails,
  getKnownOdinErrorMessages,
  getOdinErrorDetails,
} from '@youfoundation/js-lib/core';

export interface Error {
  type: 'warning' | 'critical';
  title?: string;
  message: string;
  details?: OdinErrorDetails;
}

export const useErrors = () => {
  const queryClient = useQueryClient();

  return {
    fetch: useQuery({
      queryKey: ['errors'],
      queryFn: () => [] as Error[],

      gcTime: Infinity,
      staleTime: Infinity,
    }),
    add: (error: unknown, title?: string, message?: string) => {
      const currentErrors = queryClient.getQueryData<Error[]>(['errors']);
      const knownErrorMessage = getKnownOdinErrorMessages(error);
      const details = getOdinErrorDetails(error);

      const newError: Error = {
        type: knownErrorMessage ? 'warning' : 'critical',
        title,
        message:
          message ||
          knownErrorMessage ||
          (error instanceof Error
            ? error.toString()
            : t('Something went wrong, please try again later')),
        details,
      };

      const updatedErrors = [...(currentErrors || []), newError];
      queryClient.setQueryData(['errors'], updatedErrors);
    },
    dismiss: (error: Error) => {
      const currentErrors = queryClient.getQueryData<Error[]>(['errors']);
      const updatedErrors = currentErrors?.filter((e) => e !== error);
      queryClient.setQueryData(['errors'], updatedErrors);
    },
  };
};
