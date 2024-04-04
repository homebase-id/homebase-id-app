import Clipboard from '@react-native-clipboard/clipboard';
import { useErrors } from '../../../hooks/errors/useErrors';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { Alert } from 'react-native';

// TODO: Create a PositiveToaster component
export const ErrorToaster = () => {
  const {
    fetch: { data: errors },
    dismiss: dismissError,
  } = useErrors();

  useEffect(() => {
    if (!errors?.length) return;
    errors?.map((error) =>
      Toast.show({
        text1: 'Something went wrong',
        text2: error.message,
        onHide: () => dismissError(error),
        type: 'error',
        position: 'bottom',
        visibilityTime: 2000,
        swipeable: true,
        onPress: () => {
          Alert.alert(
            error.correlationId || 'Error',
            error.message,
            [
              {
                text: 'Copy',
                onPress: () => {
                  return Clipboard.setString(error.correlationId || error.message);
                },
              },
              {
                text: 'Ok',
                style: 'cancel',
              },
            ],
            {
              cancelable: true,
            }
          );
        },
      })
    );
  }, [dismissError, errors]);

  return <></>;
};
