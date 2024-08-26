import { useDotYouClientContext } from 'feed-app-common';
import { useRouteContext } from '../../RouteContext/RouteContext';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { TabStackParamList } from '../../../app/App';
import { ChatStackParamList } from '../../../app/ChatStack';
import { useNotification } from '../../../hooks/notifications/useNotification';
import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import {
  CHAT_APP_ID,
  FEED_APP_ID,
  FEED_CHAT_APP_ID,
  MAIL_APP_ID,
  OWNER_APP_ID,
} from '../../../app/constants';
import { bodyFormer, navigateOnNotification } from '../../Dashboard/NotificationsOverview';
import Toast from 'react-native-toast-message';
import { memo, useCallback, useEffect } from 'react';

export const NotificationToaster = memo(() => {
  const { routeName } = useRouteContext();
  const identity = useDotYouClientContext().getIdentity();
  const chatNavigator = useNavigation<NavigationProp<ChatStackParamList>>();
  const feedNavigator = useNavigation<NavigationProp<TabStackParamList>>();
  const isConversationScreen = routeName?.name === 'Conversation' && !routeName.params;
  const isChatScreen = routeName?.name === 'ChatScreen' && routeName.params;
  const isFeedScreen = routeName?.name === 'Feed';
  const {
    fetch: { data: notifications },
    dismiss: dismissNotification,
  } = useNotification();
  //   console.log('notifications', notifications?.length);
  const handleNotification = useCallback(() => {
    if (!notifications) return;
    notifications.map((notification) => {
      const appId = notification.options.appId;
      const appName = stringGuidsEqual(appId, OWNER_APP_ID)
        ? 'Homebase'
        : stringGuidsEqual(appId, FEED_APP_ID)
          ? 'Homebase - Feed'
          : stringGuidsEqual(appId, CHAT_APP_ID)
            ? 'Homebase - Chat'
            : stringGuidsEqual(appId, FEED_CHAT_APP_ID) // We shouldn't ever have this one, but for sanity
              ? 'Homebase - Feed & Chat'
              : stringGuidsEqual(appId, MAIL_APP_ID)
                ? 'Homebase - Mail'
                : `Unknown (${appId})`;
      const body = bodyFormer(notification, false, appName, notification.senderId);
      const isChatNotification = stringGuidsEqual(appId, CHAT_APP_ID);
      const isFeedNotification = stringGuidsEqual(appId, FEED_APP_ID);
      if (isChatNotification) {
        // if in conversation screen, don't show notification

        if (isConversationScreen) {
          dismissNotification(notification);
          return;
        }

        // check wether we are in same chat screen for the notification
        // Don't show notification if we are in the same chat screen
        if (
          isChatScreen &&
          stringGuidsEqual(
            notification.options.typeId,
            (routeName.params as { convoId: string }).convoId
          )
        ) {
          dismissNotification(notification);
          return;
        }
      } else if (isFeedNotification && isFeedScreen) {
        dismissNotification(notification);
        return;
      }
      return Toast.show({
        type: 'notification',
        text1: appName, // TODO: Show senderName instead of APP Name
        text2: body,
        position: 'top',
        swipeable: true,
        visibilityTime: 4000,
        onPress: () => {
          navigateOnNotification(notification, identity, chatNavigator, feedNavigator);
          Toast.hide();
        },
        onHide: () => dismissNotification(notification),
        props: {
          odinId: notification.senderId,
        },
      });
    });
  }, [
    chatNavigator,
    dismissNotification,
    feedNavigator,
    identity,
    isChatScreen,
    isConversationScreen,
    isFeedScreen,
    notifications,
    routeName,
  ]);

  useEffect(() => {
    handleNotification();
  }, [handleNotification]);

  return <></>;
});
