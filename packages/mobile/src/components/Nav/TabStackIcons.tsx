import { View } from 'react-native';
import { useUnreadPushNotificationsCount } from '../../hooks/notifications/usePushNotifications';
import { Bars, ChatIcon, Feed, House, RadioTower, SqaurePlus } from '../ui/Icons/icons';
import { Colors } from '../../app/Colors';
import { CHAT_APP_ID, COMMUNITY_APP_ID, FEED_APP_ID } from '../../app/constants';

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
  const { data: unreadCount } = useUnreadPushNotificationsCount({ appId: FEED_APP_ID });
  return (
    <View style={{ position: 'relative' }}>
      <Feed {...props} size={'md'} />
      {unreadCount ? <UnreadDot /> : null}
    </View>
  );
};

export const TabChatIcon = (props: TabIconProps) => {
  const { data: unreadCount } = useUnreadPushNotificationsCount({ appId: CHAT_APP_ID });
  return (
    <View style={{ position: 'relative' }}>
      <ChatIcon {...props} size={'md'} />
      {unreadCount ? <UnreadDot /> : null}
    </View>
  );
};

export const TabCommunityIcon = (props: TabIconProps) => {
  const { data: unreadCount } = useUnreadPushNotificationsCount({ appId: COMMUNITY_APP_ID });
  return (
    <View style={{ position: 'relative' }}>
      <RadioTower {...props} size={'md'} />
      {unreadCount ? <UnreadDot /> : null}
    </View>
  );
};

export const TabHouseIcon = (props: TabIconProps) => <House {...props} size={'md'} />;
export const TabMenuIcon = (props: TabIconProps) => <Bars {...props} size={'md'} />;
export const TabComposeFeedIcon = (props: TabIconProps) => <SqaurePlus {...props} size={'md'} />;
