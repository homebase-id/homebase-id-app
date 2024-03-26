import { View } from 'react-native';
import { useUnreadPushNotificationsCount } from '../../hooks/notifications/usePushNotifications';
import { Bars, ChatIcon, Feed, House } from '../ui/Icons/icons';
import { Colors } from '../../app/Colors';

export const CHAT_APP_ID = '2d781401-3804-4b57-b4aa-d8e4e2ef39f4';
export const FEED_APP_ID = '5f887d80-0132-4294-ba40-bda79155551d';

type TabIconProps = {
  focused: boolean;
  color: string;
  size: number;
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

export const TabFeedIcon = (props: TabIconProps) => {
  const unread = !!useUnreadPushNotificationsCount({ appId: FEED_APP_ID });
  return (
    <View style={{ position: 'relative' }}>
      <Feed {...props} size={'md'} />
      {unread ? <UnreadDot /> : null}
    </View>
  );
};

export const TabChatIcon = (props: TabIconProps) => {
  const unread = !!useUnreadPushNotificationsCount({ appId: CHAT_APP_ID });
  return (
    <View style={{ position: 'relative' }}>
      <ChatIcon {...props} size={'md'} />
      {unread ? <UnreadDot /> : null}
    </View>
  );
};

export const TabHouseIcon = (props: TabIconProps) => <House {...props} size={'md'} />;
export const TabMenuIcon = (props: TabIconProps) => <Bars {...props} size={'md'} />;
