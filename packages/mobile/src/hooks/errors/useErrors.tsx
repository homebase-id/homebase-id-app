import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface Error {
  type: 'warning' | 'critical';
  message: string;
  correlationId?: string;
}

const getKnownErrorMessages = (error: unknown): string | undefined => {
  const errorCode = (error as any)?.response?.data?.errorCode;

  if (errorCode === 'noErrorCode') return undefined;
  // TODO: Can be extended with more user friendly error messages
  return errorCode;
};

const getCorrelationId = (error: unknown): string | undefined => {
  return (error as any)?.response?.headers?.['odin-correlation-id'];
};

export const useErrors = () => {
  const queryClient = useQueryClient();

  return {
    fetch: useQuery({
      queryKey: ['errors'],
      queryFn: () => [] as Error[],

      gcTime: Infinity,
      staleTime: Infinity,
    }),
    add: (error: unknown) => {
      const currentErrors = queryClient.getQueryData<Error[]>(['errors']);
      const knownErrorMessage = getKnownErrorMessages(error);
      const correlationId = getCorrelationId(error);

      const newError: Error = {
        type: knownErrorMessage ? 'warning' : 'critical',
        message:
          knownErrorMessage ||
          (error instanceof Error ? error.message : 'Something went wrong, please try again later'),
        correlationId,
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
