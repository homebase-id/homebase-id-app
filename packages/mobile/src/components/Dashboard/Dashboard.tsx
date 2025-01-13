import { useDotYouClientContext } from 'homebase-id-app-common';
import { FC, memo, useCallback } from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { openURL } from '../../utils/utils';
import { BrandIconProps, Homebase, HomebaseCommunity, HomebaseMail } from '../ui/Icons/brandIcons';
import { useUnreadPushNotificationsCount } from '../../hooks/notifications/usePushNotifications';
import { COMMUNITY_APP_ID, MAIL_APP_ID, OWNER_APP_ID } from '../../app/constants';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Text } from '../ui/Text/Text';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { TabStackParamList } from '../../app/App';

export const Dashboard = memo(() => {
  const navigation = useNavigation<NavigationProp<TabStackParamList>>();
  const openCommunity = useCallback(
    () => navigation.navigate('Community', { screen: 'Home', params: {} }),
    [navigation]
  );

  return (
    <>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          marginVertical: 16,
        }}
      >
        <AppLink label="Owner console" appPath="owner" appId={OWNER_APP_ID} icon={Homebase} />
        <AppLink label="Mail" appPath="apps/mail" appId={MAIL_APP_ID} icon={HomebaseMail} />
        <AppLink
          label="Community"
          appPath="apps/community"
          onPress={openCommunity}
          appId={COMMUNITY_APP_ID}
          icon={HomebaseCommunity}
          alwaysExternal={true}
        />
      </View>
    </>
  );
});

const AppLink = (props: {
  label: string;
  appPath: string;
  onPress?: () => void;
  appId: string;
  icon: FC<BrandIconProps>;
  style?: ViewStyle;
  alwaysExternal?: boolean;
}) => {
  const { isDarkMode } = useDarkMode();
  const identity = useDotYouClientContext().getLoggedInIdentity();
  const { data: unreadCount } = useUnreadPushNotificationsCount({ appId: props.appId });

  return (
    <TouchableOpacity
      style={{
        width: '40%',
        display: 'flex',
        flexDirection: 'row',
        flexGrow: 1,
        flexShrink: 0,
        gap: 8,
        alignItems: 'center',
        position: 'relative',
        padding: 8,
        backgroundColor: isDarkMode ? Colors.black : Colors.white,
        borderRadius: 10,
        borderStyle: 'solid',
        borderColor: isDarkMode ? Colors.slate[700] : Colors.slate[200],
        borderWidth: 1,
        ...props.style,
      }}
      onPress={
        props.onPress ||
        (() => openURL(`https://${identity}/${props.appPath}`, props.alwaysExternal))
      }
    >
      <View style={{ position: 'relative' }}>
        <props.icon size={'4xl'} />
        {unreadCount ? <UnreadDot /> : null}
      </View>
      <Text>{props.label}</Text>
    </TouchableOpacity>
  );
};

const UnreadDot = () => {
  return (
    <View
      style={{
        backgroundColor: Colors.red[500],
        width: 10,
        height: 10,
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 5,
      }}
    />
  );
};
