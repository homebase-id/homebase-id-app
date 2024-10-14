import { useEffect } from 'react';
import { useErrors } from '../../../hooks/errors/useErrors';

export const ErrorNotification = ({
  error,
  onlyLogging,
}: {
  error: Error | unknown;
  onlyLogging?: boolean;
}) => {
  const addError = useErrors().add;

  useEffect(() => {
    if (error) {
      addError(error, undefined, undefined, onlyLogging);
    }
  }, [addError, error, onlyLogging]);

  return <></>;
};
