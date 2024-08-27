import { BaseToast, BaseToastProps } from 'react-native-toast-message';
import { useCallback } from 'react';
import { View } from 'react-native';
import { CircleExclamation } from '../Icons/icons';
import { Colors } from '../../../app/Colors';

export function ErrorToast(props: BaseToastProps) {
  const renderLeadingIcon = useCallback(() => {
    return (
      <View
        style={{
          marginLeft: 16,
          alignContent: 'center',
          justifyContent: 'center',
        }}
      >
        <CircleExclamation color={Colors.white} />
      </View>
    );
  }, []);
  return (
    <BaseToast
      style={{
        borderRadius: 25,
        backgroundColor: Colors.red[700],
        borderLeftWidth: 0,
      }}
      {...props}
      text1Style={{
        color: Colors.white,
        fontSize: 15,
      }}
      text2Style={{
        color: Colors.white,
        fontSize: 13,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      renderLeadingIcon={renderLeadingIcon}
    />
  );
}
