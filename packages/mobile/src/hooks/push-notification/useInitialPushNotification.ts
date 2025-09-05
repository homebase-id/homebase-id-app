import messaging from '@react-native-firebase/messaging';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { tryJsonParse } from '@homebase-id/js-lib/helpers';
import { navigateOnNotification } from '../../components/Dashboard/NotificationsOverview';
import { PushNotification } from '@homebase-id/js-lib/core';
import { useDotYouClientContext } from 'homebase-id-app-common';
import { useCallback, useEffect } from 'react';
import notifee, { Event, EventType } from '@notifee/react-native';
import { AppState, Platform } from 'react-native';
import { AuthStackParamList } from '../../app/App';
const handledNotifications: unknown[] = [];

export const useInitialPushNotification = () => {
  const identity = useDotYouClientContext().getLoggedInIdentity() || '';
  const tabNavigator = useNavigation<NavigationProp<AuthStackParamList, 'Authenticated'>>();

  const handleInitialNotification = useCallback(
    async (stringifiedData: string) => {
      const notification: PushNotification = tryJsonParse<PushNotification>(stringifiedData);
      if (notification) {
        await notifee.decrementBadgeCount();
        navigateOnNotification(notification, identity, tabNavigator, true);
      }
    },
    [tabNavigator, identity]
  );

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
        if (handledNotifications.includes(initialNotification.data.data)) return;
        handledNotifications.push(initialNotification.data.data);
        handleInitialNotification(initialNotification.data.data);
      }
    })();
  }, [handleInitialNotification]);

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

  useEffect(() => {
    if (Platform.OS === 'ios') {
      notifee.onForegroundEvent(async (event: Event) => {
        if (event.type === EventType.PRESS) {
          console.log('onForegroundEvent', event.detail.notification?.data?.data);
          if (
            event.detail &&
            event.detail.notification &&
            event.detail.notification.data?.data &&
            typeof event.detail.notification.data?.data === 'string'
          ) {
            await handleInitialNotification(event.detail.notification.data.data);
          }
        }
      });
    }
  }, [handleInitialNotification]);
};
