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

  // https://notifee.app/react-native/docs/events#foreground-events
  notifee.onForegroundEvent(async ({ type, detail }) => {
    console.debug('onForegroundEvent event:', type, detail);
    await handleNotificationMessage(type, detail, true);
  });

  // https://notifee.app/react-native/docs/events#background-events
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.debug('onBackgroundEvent event:', type, detail);
    await handleNotificationMessage(type, detail, false);
  });
};

//

const onMessageReceived = async (message: FirebaseMessagingTypes.RemoteMessage) => {
  console.debug('FCM Message:', message);

  const notification = message.data as unknown as PushNotificationMessage;
  const data = notification.data as unknown as string;
  notification.data = JSON.parse(data);

  console.debug('ODIN Notification:', notification);
  storeNotification(notification);
  console.debug('ODIN Notifications:', notifications.length);

  // SEB:NOTE notification.version helps with backwards compatibility

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

export const handleNotificationMessage = async (
  type: EventType,
  detail: EventDetail,
  isForegroundEvent: boolean
): Promise<void> => {
  const id = detail.notification?.id;

  // Sanity #1
  if (!id) {
    throw new Error('No id in notification');
  }

  const notification = getNotifcationById(id);
  if (notification) {
    if (isForegroundEvent) {
      for (const subscriber of notificationSubscribers) {
        await subscriber.onNotificationReceived(type, notification);
      }
    }
  }

  notifee.setBadgeCount(notifications.length);
};

//
// Notification "storage"
//

const notifications: Array<PushNotificationMessage> = [];

export const getNotifcationById = (id: string): PushNotificationMessage | null => {
  return notifications.find((x) => x.id === id) || null;
};

//

export const getNotifcations = (): Array<PushNotificationMessage> => {
  return [...notifications];
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
  onNotificationReceived: (type: EventType, notification: PushNotificationMessage) => Promise<void>;
}[] = [];

export const Subscribe = (
  onNotificationReceived: (type: EventType, notification: PushNotificationMessage) => Promise<void>
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
  onNotificationReceived: (type: EventType, notification: PushNotificationMessage) => Promise<void>
) => {
  const index = notificationSubscribers.findIndex(
    (subscriber) => subscriber.onNotificationReceived === onNotificationReceived
  );
  if (index !== -1) {
    notificationSubscribers.splice(index, 1);
  }
};
