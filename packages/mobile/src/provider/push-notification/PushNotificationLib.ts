import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { EventType, EventDetail } from '@notifee/react-native';
import { PushNotificationOptions } from '@youfoundation/js-lib/dist';

// backend: src/services/Odin.Services/AppNotifications/Push/PushNotificationContent.cs
interface PushNotificationPayload {
  senderId: string;
  timestamp: string;
  appDisplayName: string;
  options: PushNotificationOptions;
}

// backend: src/core/Odin.Core/Dto/DevicePushNotificationRequest.cs
export interface PushNotificationMessage {
  correlationId: string;
  id: string;
  data: PushNotificationPayload;
  timestamp: string;
  version: number;
}

//

export const initializePushNotificationSupport = async () => {
  messaging().onMessage(onMessageReceived);
  messaging().setBackgroundMessageHandler(onMessageReceived);

  // https://notifee.app/react-native/docs/events#background-events
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.debug('onBackgroundEvent event:', type, detail);
    await handleNotificationEvent(type, detail, false);
  });
};

//

const onMessageReceived = async (message: FirebaseMessagingTypes.RemoteMessage) => {
  console.debug('FCM Message:', message);

  const notification = message.data as unknown as PushNotificationMessage;
  const data = notification.data as unknown as string;
  notification.data = JSON.parse(data);

  console.debug('ODIN notification:', notification);

  storeNotification(notification);

  // SEB:TODO branch on notification.version and notification.type

  // SEB:TODO Is it normal to display a notification when the app is in the foreground, or
  // should it only do it when AppState.currentState !== 'active' ?
  await notifee.displayNotification({
    id: notification?.id,
    title: 'Odin message',
    body: `Message received from ${notification?.data?.senderId || 'unknown'}`,
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

export const handleNotification = async (notification: PushNotificationMessage): Promise<void> => {
  console.debug('TODO do stuff with the notification here:', notification.id);

  for (const subscriber of notificationSubscribers) {
    subscriber.onNotificationReceived(notification);
  }

  // Make sure notification widget is removed when we're done with it
  // (notifee doesn't always do this automatically):
  // await notifee.cancelNotification(notification.id);

  // Cleanup notification from memory when you're done with it:
  // deleteNotification(notification);
};

//

//
// Notification "storage"
//

const notifications: Array<PushNotificationMessage> = [];

export const getNotifcationById = (id: string): PushNotificationMessage | null => {
  return notifications.find((x) => x.id === id) || null;
};

//

export const getNotifcations = (): Array<PushNotificationMessage> => {
  return notifications;
};

//

export const storeNotification = (notification: PushNotificationMessage): void => {
  const existingNotification = getNotifcationById(notification.id);
  if (!existingNotification) {
    notifications.push(notification);
  }
};

//

export const deleteNotification = (notification: PushNotificationMessage): void => {
  const idx = notifications.findIndex((x) => x.id === notification.id);
  if (idx !== -1) {
    notifications.splice(idx, 1);
  }
};

//
// Notification subscribers
//

const notificationSubscribers: {
  onNotificationReceived: (notification: PushNotificationMessage) => void;
}[] = [];

export const Subscribe = (
  onNotificationReceived: (notification: PushNotificationMessage) => void
) => {
  const index = notificationSubscribers.findIndex(
    (subscriber) => subscriber.onNotificationReceived === onNotificationReceived
  );
  if (index === -1) {
    notificationSubscribers.push({ onNotificationReceived });
  }
  return () => Unsubscribe(onNotificationReceived);
};

export const Unsubscribe = (
  onNotificationReceived: (notification: PushNotificationMessage) => void
) => {
  const index = notificationSubscribers.findIndex(
    (subscriber) => subscriber.onNotificationReceived === onNotificationReceived
  );
  if (index !== -1) {
    notificationSubscribers.splice(index, 1);
  }
};
