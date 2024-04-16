import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { PushNotificationOptions } from '@youfoundation/js-lib/core';

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
  // console.debug('initializePushNotificationSupport');
  messaging().onMessage(onMessageReceived);
  messaging().setBackgroundMessageHandler(onMessageReceived);
};

//

const onMessageReceived = async (message: FirebaseMessagingTypes.RemoteMessage): Promise<void> => {
  console.log('FCM Message:', message);

  // Sanity #1 (yes, this can happen...)
  if (!message?.data?.version) {
    return;
  }

  // Sanity #2
  let notification: PushNotificationMessage;
  try {
    notification = parseNotificationMessage(message);
  } catch (error) {
    console.error('Failed to parse notification message:', error);
    return;
  }

  console.log('NOTIFICATION:', notification);

  await Promise.resolve();
};

//

export const parseNotificationMessage = (
  message: FirebaseMessagingTypes.RemoteMessage
): PushNotificationMessage => {
  const notification = message.data as unknown as PushNotificationMessage;
  const data = notification.data as unknown as string;
  notification.data = JSON.parse(data);
  return notification;
};
