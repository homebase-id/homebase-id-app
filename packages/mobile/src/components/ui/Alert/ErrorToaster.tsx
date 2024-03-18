import Clipboard from '@react-native-clipboard/clipboard';
import { useErrors } from '../../../hooks/errors/useErrors';
import Toast from 'react-native-toast-message';

export const ErrorToaster = () => {
  const {
    fetch: { data: errors },
    dismiss: dismissError,
  } = useErrors();

  return (
    <>
      {errors?.map((error) =>
        Toast.show({
          text1: 'Something went wrong',
          text2: error.message,
          onHide: () => dismissError(error),
          type: 'error',
          position: 'bottom',
          onPress: () => {
            //TODO: Show Error Details Modal
            if (error.correlationId) Clipboard.setString(error.correlationId);
          },
        })
      )}
    </>
  );
};
