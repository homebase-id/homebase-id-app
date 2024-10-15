import { useEffect } from 'react';
import { useErrors } from '../../../hooks/errors/useErrors';

export const ErrorNotification = ({ error }: { error: Error | unknown }) => {
  const addError = useErrors().add;

  useEffect(() => {
    if (error) {
      addError(error);
    }
  }, [addError, error]);

  return <></>;
};
