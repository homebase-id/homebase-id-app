import { AppState } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { EventType, EventDetail } from '@notifee/react-native';

export interface OdinChatNotificationData {
  sender: string;
  message: string;
}

export interface OdinNotification {
  version: number;
  id: string;
  correlationId: string;
  type: string;
  data: string;
}

//

export const handleNotificationEvent = async (
  type: EventType,
  detail: EventDetail,
  isForegroundEvent: boolean
): Promise<void> => {
  const id = detail.notification?.id;

  if (!id) {
    throw new Error('No id in notification');
  }

  // We can get called with the same notification multiple times, so make sure
  // it is deleted from memory after we're done with it.
  const notification = getNotifcationById(id);
  if (!notification) {
    await notifee.cancelNotification(id);
    return;
  }

  if (type === EventType.DELIVERED) {
    console.debug(
      `handleNotificationEvent DELIVERED ${notification.id}, foreground: ${isForegroundEvent}`
    );
    if (isForegroundEvent) {
      await handleNotification(notification);
    }
  }

  if (type === EventType.PRESS) {
    console.debug(
      `handleNotificationEvent PRESS ${notification.id}, foreground: ${isForegroundEvent}`
    );
    await handleNotification(notification);
  }
};

//

export const handleNotification = async (notification: OdinNotification): Promise<void> => {
  console.debug('TODO do stuff with the notification here:', notification.id);

  // Make sure notification widget is removed when we're done with it
  // (notifee doesn't always do this automatically):
  await notifee.cancelNotification(notification.id);

  // Cleanup notification from memory when you're done with it:
  deleteNotification(notification);
};

//

const onMessageReceived = async (message: FirebaseMessagingTypes.RemoteMessage) => {
  console.debug('FCM Message:', message);

  const notification = message.data as unknown as OdinNotification;
  storeNotification(notification);

  console.debug('notification:', notification);

  // SEB:TODO branch on notification.version and notification.type

  const odinChatNotificationData = JSON.parse(notification.data) as OdinChatNotificationData;

  // SEB:TODO Is it normal to display a notification when the app is in the foreground, or
  // should it only do it when AppState.currentState !== 'active' ?
  await notifee.displayNotification({
    id: notification?.id,
    title: 'Odin message',
    body: `Message received from ${odinChatNotificationData?.sender || 'unknown'}`,
    android: {
      channelId: 'default',
      // smallIcon: 'name-of-a-small-icon', // optional, defaults to 'ic_launcher'.
      // pressAction is needed if you want the notification to open the app when pressed
      pressAction: {
        id: 'default',
      },
    },
  });
};

export const initializeNotificationSupport = async () => {
  messaging().onMessage(onMessageReceived);
  messaging().setBackgroundMessageHandler(onMessageReceived);

  // https://notifee.app/react-native/docs/events#background-events
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.debug('onBackgroundEvent event:', type, detail);
    await handleNotificationEvent(type, detail, false);
  });
};

//
// Notification "storage"
//

const notifications: Array<OdinNotification> = [];

export const getNotifcationById = (id: string): OdinNotification | null => {
  return notifications.find((x: OdinNotification) => x.id === id) || null;
};

//

export const getNotifcations = (): Array<OdinNotification> => {
  return notifications;
};

//

export const storeNotification = (notification: OdinNotification): void => {
  const existingNotification = getNotifcationById(notification.id);
  if (!existingNotification) {
    notifications.push(notification);
  }
};

//

export const deleteNotification = (notification: OdinNotification): void => {
  const idx = notifications.findIndex((x: OdinNotification) => x.id === notification.id);
  if (idx !== -1) {
    notifications.splice(idx, 1);
  }
};
