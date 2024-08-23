import { BaseToast, ToastConfigParams } from 'react-native-toast-message';
import { useCallback } from 'react';
import { View } from 'react-native';
import { Colors } from '../../../app/Colors';
import { useDarkMode } from '../../../hooks/useDarkMode';

import { Avatar } from '../Avatars/Avatar';

export type NotificationToastProps = {
  odinId: string;
  conversationId?: string;
};

export function NotificationToast(props: ToastConfigParams<NotificationToastProps>) {
  const { isDarkMode } = useDarkMode();
  const { odinId } = props.props;
  const renderLeadingIcon = useCallback(() => {
    return (
      <View
        style={{
          marginLeft: 12,
          alignContent: 'center',
          justifyContent: 'center',
        }}
      >
        <Avatar
          odinId={odinId}
          imageSize={{
            width: 40,
            height: 40,
          }}
          style={{
            width: 40,
            height: 40,
          }}
        />
      </View>
    );
  }, [odinId]);
  return (
    <BaseToast
      style={{
        borderRadius: 15,
        backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[500],
        borderLeftWidth: 0,
        height: 70,
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
