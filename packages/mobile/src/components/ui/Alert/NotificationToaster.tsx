import { useDotYouClientContext } from 'homebase-id-app-common';
import { useRouteContext } from '../../RouteContext/RouteContext';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useNotification } from '../../../hooks/notifications/useNotification';
import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { CHAT_APP_ID, COMMUNITY_APP_ID, FEED_APP_ID } from '../../../app/constants';
import { bodyFormer, navigateOnNotification } from '../../Dashboard/NotificationsOverview';
import Toast from 'react-native-toast-message';
import { useCallback, useEffect } from 'react';
import { getContactByOdinId } from '@homebase-id/js-lib/network';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabStackParamList } from '../../../app/App';
import { getAppName } from '../../../utils/utils';

export const NotificationToaster = () => {
  const { route } = useRouteContext();
  const dotYouClient = useDotYouClientContext();
  const identity = useDotYouClientContext().getLoggedInIdentity() || '';
  const tabNavigator = useNavigation<NavigationProp<TabStackParamList>>();
  const isConversationScreen = route?.name === 'Conversation' && !route.params;
  const isChatScreen = route?.name === 'ChatScreen' && route.params;
  const isFeedScreen = route?.name === 'Posts';
  const isCommunityScreen = route?.name === 'Community' && route.params;
  const { top } = useSafeAreaInsets();
  const {
    fetch: { data: notifications },
    dismiss: dismissNotification,
  } = useNotification();
  //   console.log('notifications', notifications?.length);
  const handleNotification = useCallback(() => {
    if (!notifications) return;
    notifications.map(async (notification) => {
      const appId = notification.options.appId;
      const appName = getAppName(appId);
      const contactFile = await getContactByOdinId(dotYouClient, notification.senderId);
      const senderName =
        contactFile?.fileMetadata.appData.content.name?.displayName || notification.senderId;
      const body = bodyFormer(notification, false, appName, senderName);
      const isChatNotification = stringGuidsEqual(appId, CHAT_APP_ID);
      const isFeedNotification = stringGuidsEqual(appId, FEED_APP_ID);
      const isCommunityNotification = stringGuidsEqual(appId, COMMUNITY_APP_ID);
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
            (route.params as { convoId: string }).convoId
          )
        ) {
          dismissNotification(notification);
          return;
        }
      } else if (isFeedNotification && isFeedScreen) {
        dismissNotification(notification);
        return;
      } else if (isCommunityScreen && isCommunityNotification) {
        dismissNotification(notification);
        return;
      }
      return Toast.show({
        type: 'notification',
        text1: appName,
        text2: body,
        position: 'top',
        swipeable: true,
        visibilityTime: 4000,
        topOffset: top,
        onPress: () => {
          navigateOnNotification(notification, identity, tabNavigator);
          Toast.hide();
        },
        onHide: () => dismissNotification(notification),
        props: {
          odinId: notification.senderId,
        },
      });
    });
  }, [
    notifications,
    dotYouClient,
    isFeedScreen,
    isCommunityScreen,
    top,
    isConversationScreen,
    isChatScreen,
    route?.params,
    dismissNotification,
    identity,
    tabNavigator,
  ]);

  useEffect(() => {
    handleNotification();
  }, [handleNotification]);

  return <></>;
};
