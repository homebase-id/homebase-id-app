import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { PushNotification } from '@homebase-id/js-lib/core';
import notifee, { AndroidVisibility } from '@notifee/react-native';
import { bodyFormer } from '../../components/Dashboard/NotificationsOverview';
import axios from 'axios';
import logger from '../log/logger';

//
// CAVEATS GALORE!
//
// This is the BARE MIMIMUM required to get a push notification to the device.
//
// Notifications can not be sent to iOS simulators. Use a real device.
//
// Messages can be sent as data messages or notification messages or both. Check the backend code.
// They behave differently on ios and android. On iOS, only notification messages are guaranteed to be delivered.
//
// When the app is in the background, notification messages will always show a notification with backend
// determined title and body. Data messages can be used with e.g. Notifiee to better control the notification UI
// but are not guaranteed to be delivered.
//
// Stuff to consider from here (in no particular order):
// - Separate onMessage and setBackgroundMessageHandler in to separate functions.
// - Use Notifee (https://notifee.app/react-native/docs/overview) for better handling of notifications
//   locally. Be warned that even though Notifee is from the same source as Firebase messaging lib, it's a separate
//   package and it has its own quirks ans conflicts with firebase messaging (!) in certain areas.
// - use messaging().getInitialNotification() to get the initial notification when the app is opened from a notification.
//   BEWARE of Notifee here!
// - Notifee conflicts with certain splash screen libraries. Be warned.
//

// backend: src/services/Odin.Services/AppNotifications/Push/PushNotificationContent.cs
// backend: src/services/Odin.Services/AppNotifications/Push/PushNotificationContent.cs
interface PushNotificationPayload extends PushNotification {
  appDisplayName: string;
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
  messaging().onMessage(onForegroundMessageReceived);
  messaging().setBackgroundMessageHandler(onBackgroundMessageReceived);

  // Android channels
  await notifee.createChannel({
    id: 'default',
    name: 'Primary Notifications',
    visibility: AndroidVisibility.PRIVATE,
  });

  // iOS categories
  await notifee.setNotificationCategories([
    {
      id: 'communications',
      allowAnnouncement: true,
      allowInCarPlay: true,
    },
  ]);
};

//
const baseMessageParsing = async (
  message: FirebaseMessagingTypes.RemoteMessage
): Promise<PushNotificationMessage | undefined> => {
  console.log('FCM Message:', message);

  // Sanity #1 (yes, this can happen...)
  if (!message?.data?.version) {
    return;
  }

  // Sanity #2
  try {
    const notification = parseNotificationMessage(message);
    console.log('NOTIFICATION:', notification);

    return notification;
  } catch (error) {
    logger.Error('Failed to parse notification message:', error);
    console.error('Failed to parse notification message:', error);
    return;
  }
};

const onForegroundMessageReceived = async (
  message: FirebaseMessagingTypes.RemoteMessage
): Promise<void> => {
  const notification = await baseMessageParsing(message);
  if (!notification) return;

  // TODO: Check if this one is needed
  await notifee.incrementBadgeCount();
};

const onBackgroundMessageReceived = async (
  message: FirebaseMessagingTypes.RemoteMessage
): Promise<void> => {
  const notification = await baseMessageParsing(message);
  if (!notification) return;

  await notifee.incrementBadgeCount();

  if (message.notification) {
    return;
  }
  const displayName =
    (await axios
      .get(`https://${notification.data.senderId}/pub/profile`)
      .then((response) => response.data?.name as string | undefined)
      .catch(() => undefined)) || notification.data.senderId;

  // If there's no "notification" object directly in the FCM message, it's a data message, and we handle it ourselve
  await notifee.displayNotification({
    title: notification.data.appDisplayName,
    body:
      bodyFormer(notification.data, false, notification.data.appDisplayName, displayName) ||
      `Received from ${notification.data.senderId}`,
    // Keeps them backwards compatible with the OOTB push notifications within FCM
    data: { data: JSON.stringify(notification.data) },
    android: {
      channelId: 'default',
      largeIcon: `https://${notification.data.senderId}/pub/image`,
      smallIcon: 'ic_notification',
      circularLargeIcon: true,
      pressAction: {
        id: 'default',
      },
      sound: 'default',
    },
    ios: {
      categoryId: 'communications',
      communicationInfo: {
        conversationId: notification.data.options.typeId,
        sender: {
          id: notification.data.senderId,
          avatar: `https://${notification.data.senderId}/pub/image`,
          displayName: displayName || notification.data.senderId,
        },
      },
      sound: 'default',
    },
  });

  return;
};

export const parseNotificationMessage = (
  message: FirebaseMessagingTypes.RemoteMessage
): PushNotificationMessage => {
  const notification = message.data as unknown as PushNotificationMessage;
  const data = notification.data as unknown as string;
  notification.data = JSON.parse(data);
  return notification;
};
