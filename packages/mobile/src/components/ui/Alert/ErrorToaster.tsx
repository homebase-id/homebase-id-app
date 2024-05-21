import Clipboard from '@react-native-clipboard/clipboard';
import { useErrors } from '../../../hooks/errors/useErrors';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { t } from 'feed-app-common';

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
        text1: error.title || t('Something went wrong'),
        text2: error.details ? t('Click for details') : error.message,
        onHide: () => dismissError(error),
        type: 'error',
        position: 'bottom',
        visibilityTime: 2500,
        swipeable: true,
        onPress: () => {
          Alert.alert(
            error.message || 'Error',
            `${error.details?.title} ${error.details?.stackTrace}`,
            [
              {
                text: 'Copy',
                onPress: () => {
                  return Clipboard.setString(`${error.message || 'Error'}
                  ${error.details?.title} ${error.details?.stackTrace}`);
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
