import { useEffect, useRef } from 'react';
import { useErrors } from '../../../hooks/errors/useErrors';

export const ErrorNotification = ({ error }: { error: Error | unknown }) => {
  const addError = useErrors().add;
  const handledAnError = useRef(false);

  useEffect(() => {
    if (error && !handledAnError.current) {
      handledAnError.current = true;
      addError(error);
    }
  }, [addError, error]);

  return <></>;
};
