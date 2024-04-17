import messaging from '@react-native-firebase/messaging';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { tryJsonParse } from '@youfoundation/js-lib/helpers';
import { navigateOnNotification } from '../../components/Dashboard/NotificationsOverview';
import { ChatStackParamList, TabStackParamList } from '../../app/App';
import { PushNotification } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
import { useEffect } from 'react';

export const useInitialPushNotification = () => {
  const identity = useDotYouClientContext().getIdentity();
  const chatNavigator = useNavigation<NavigationProp<ChatStackParamList>>();
  const feedNavigator = useNavigation<NavigationProp<TabStackParamList>>();
  const getInitialNotification = () => {
    (async () => {
      const initialNotification =
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
          navigateOnNotification(notification, identity, chatNavigator, feedNavigator);
        }
      }
    })();
  };

  useFocusEffect(getInitialNotification);
  useEffect(getInitialNotification, [chatNavigator, feedNavigator, identity]);
};
