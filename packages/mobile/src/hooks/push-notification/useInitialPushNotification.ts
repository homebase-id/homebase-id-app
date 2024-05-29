import messaging from '@react-native-firebase/messaging';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { tryJsonParse } from '@youfoundation/js-lib/helpers';
import { navigateOnNotification } from '../../components/Dashboard/NotificationsOverview';
import { TabStackParamList } from '../../app/App';
import { PushNotification } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
import { useCallback, useEffect } from 'react';
import { ChatStackParamList } from '../../app/ChatStack';
import notifee from '@notifee/react-native';
import { AppState } from 'react-native';

export const useInitialPushNotification = () => {
  const identity = useDotYouClientContext().getIdentity();
  const chatNavigator = useNavigation<NavigationProp<ChatStackParamList>>();
  const feedNavigator = useNavigation<NavigationProp<TabStackParamList>>();

  const getInitialNotification = useCallback(() => {
    (async () => {
      const initialNotification =
        (await notifee.getInitialNotification())?.notification ||
        (await messaging().getInitialNotification()) ||
        (await new Promise((resolve) => messaging().onNotificationOpenedApp(resolve)));

      if (
        initialNotification &&
        initialNotification.data?.data &&
        typeof initialNotification.data.data === 'string'
      ) {
        const notification: PushNotification = tryJsonParse<PushNotification>(
          initialNotification.data.data
        );
        if (notification) {
          await notifee.decrementBadgeCount();
          navigateOnNotification(notification, identity, chatNavigator, feedNavigator);
        }
      }
    })();
  }, [chatNavigator, feedNavigator, identity]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        getInitialNotification();
        // Dismisses all notifications when the app is opened
        notifee.cancelAllNotifications();
        notifee.setBadgeCount(0);
      }
    });
    return () => listener.remove();
  }, [getInitialNotification]);
};
