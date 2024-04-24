import { TouchableOpacity, View } from 'react-native';

import { usePushNotifications } from '../../hooks/notifications/usePushNotifications';
import { memo, useMemo, useState } from 'react';
import { PushNotification } from '@youfoundation/js-lib/core';
import { formatToTimeAgoWithRelativeDetail, useDotYouClientContext } from 'feed-app-common';
import { stringGuidsEqual } from '@youfoundation/js-lib/helpers';
import {
  CHAT_APP_ID,
  FEED_APP_ID,
  FEED_CHAT_APP_ID,
  MAIL_APP_ID,
  OWNER_APP_ID,
} from '../../app/constants';
import useContact from '../../hooks/contact/useContact';
import { Colors } from '../../app/Colors';
import { Times } from '../ui/Icons/icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList, TabStackParamList } from '../../app/App';
import { useDarkMode } from '../../hooks/useDarkMode';
import { openURL } from '../../utils/utils';
import { Text } from '../ui/Text/Text';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import { useLivePushNotifications } from '../../hooks/notifications/useLivePushNotifications';

export const NotificationsOverview = memo(() => {
  useLivePushNotifications();
  const { data: notifications } = usePushNotifications().fetch;
  const groupedNotificationsPerDay = useMemo(
    () =>
      notifications?.results.reduce(
        (acc, notification) => {
          const date = new Date(notification.created).toDateString();

          if (acc[date]) acc[date].push(notification);
          else acc[date] = [notification];

          return acc;
        },
        {} as { [key: string]: PushNotification[] }
      ) || {},
    [notifications]
  );

  return notifications?.results?.length ? (
    <>
      <View
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          paddingHorizontal: 2,
          paddingRight: 15,
        }}
      >
        {Object.keys(groupedNotificationsPerDay).map((day) => (
          <NotificationDay
            day={new Date(day)}
            notifications={groupedNotificationsPerDay[day]}
            key={day}
          />
        ))}
      </View>
    </>
  ) : null;
});

const NotificationDay = ({
  day,
  notifications,
}: {
  day: Date;
  notifications: PushNotification[];
}) => {
  const groupedNotifications =
    notifications?.reduce(
      (acc, notification) => {
        if (acc[notification.options.appId]) acc[notification.options.appId].push(notification);
        else acc[notification.options.appId] = [notification];

        return acc;
      },
      {} as { [key: string]: PushNotification[] }
    ) || {};

  const today = new Date();
  const isToday = day.toDateString() === today.toDateString();

  return (
    <>
      <Text style={{ color: Colors.gray[500] }}>
        {isToday ? 'Today' : formatToTimeAgoWithRelativeDetail(day, false, true)}
      </Text>

      {Object.keys(groupedNotifications).map((appId) => (
        <NotificationAppGroup
          appId={appId}
          notifications={groupedNotifications[appId]}
          key={appId}
        />
      ))}
    </>
  );
};

const NotificationAppGroup = ({
  appId,
  notifications,
}: {
  appId: string;
  notifications: PushNotification[];
}) => {
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

  const groupedByTypeNotifications =
    notifications.reduce(
      (acc, notification) => {
        if (acc[notification.options.typeId]) acc[notification.options.typeId].push(notification);
        else acc[notification.options.typeId] = [notification];

        return acc;
      },
      {} as { [key: string]: PushNotification[] }
    ) || {};

  return (
    <>
      {Object.keys(groupedByTypeNotifications).map((typeId) => {
        const typeGroup = groupedByTypeNotifications[typeId];

        return <NotificationGroup typeGroup={typeGroup} appName={appName} key={typeId} />;
      })}
    </>
  );
};

const NotificationGroup = ({
  typeGroup,
  appName,
}: {
  typeGroup: PushNotification[];
  appName: string;
}) => {
  const canExpand = typeGroup.length > 1;
  const [isExpanded, setExpanded] = useState(!canExpand);

  const { mutate: remove } = usePushNotifications().remove;

  const groupCount = typeGroup.length - 1;
  const visibleLength = isExpanded ? 10 : 3;

  const identity = useDotYouClientContext().getIdentity();
  const chatNavigator = useNavigation<NavigationProp<ChatStackParamList>>();
  const feedNavigator = useNavigation<NavigationProp<TabStackParamList>>();

  return (
    <View
      style={{
        paddingBottom: isExpanded ? 0 : visibleLength * 4,
      }}
    >
      <View style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {typeGroup.slice(0, visibleLength).map((notification, index) => (
          <View
            key={notification.id}
            style={{
              ...(index === 0 || isExpanded
                ? { position: 'relative', zIndex: 10 }
                : { position: 'absolute', borderRadius: 8, overflow: 'hidden' }),

              ...(index === 0 || isExpanded
                ? {}
                : {
                    top: index * 4,
                    bottom: index * -4,
                    left: index * 2,
                    right: index * -4,
                    zIndex: 4 - index,
                    opacity: 1 - 0.3 * index,
                  }),
            }}
          >
            <NotificationItem
              notification={notification}
              isExpanded={index === 0 || isExpanded}
              onDismiss={() => remove([notification.id])}
              onOpen={() =>
                canExpand && !isExpanded
                  ? setExpanded(true)
                  : navigateOnNotification(notification, identity, chatNavigator, feedNavigator)
              }
              groupCount={isExpanded ? 0 : groupCount}
              appName={appName}
            />
          </View>
        ))}
        {canExpand && isExpanded ? (
          <TouchableOpacity
            style={{ display: 'flex', flexDirection: 'row-reverse' }}
            onPress={() => setExpanded(false)}
          >
            <Text>Hide</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const NotificationItem = ({
  notification,
  isExpanded,
  onOpen,
  onDismiss,
  groupCount,
  appName,
}: {
  notification: PushNotification;
  isExpanded: boolean;
  onOpen: () => void;
  onDismiss: () => void;
  groupCount: number;
  appName: string;
}) => {
  const { isDarkMode } = useDarkMode();
  const identity = useDotYouClientContext().getIdentity();
  const isLocalNotification = notification.senderId === identity;

  const { data: contactFile } = useContact(
    isLocalNotification ? undefined : notification.senderId
  ).fetch;
  const senderName = contactFile?.fileMetadata.appData.content.name?.displayName;

  const title = useMemo(() => `${appName}`, [appName]);
  const body = useMemo(
    () => bodyFormer(notification, false, appName, senderName),
    [notification, senderName, appName]
  );

  return (
    <TouchableOpacity onPress={onOpen}>
      <View
        style={{
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
          borderRadius: 10,
          borderStyle: 'solid',
          borderColor: isDarkMode ? Colors.slate[700] : Colors.slate[200],
          borderWidth: 1,
          overflow: 'hidden',
          paddingHorizontal: 8,
          paddingVertical: 8,
        }}
      >
        <View style={{ display: 'flex', flexDirection: 'row' }}>
          <Text style={{ fontWeight: '600', color: isDarkMode ? Colors.white : Colors.black }}>
            {title}
          </Text>
          {isExpanded ? (
            <TouchableOpacity onPress={onDismiss} style={{ marginLeft: 'auto' }}>
              <Times size={'sm'} />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={{ color: isDarkMode ? Colors.white : Colors.black }}>{body}</Text>

        {notification.created ? (
          <Text style={{ color: Colors.slate[500] }}>
            {formatToTimeAgoWithRelativeDetail(new Date(notification.created))}
          </Text>
        ) : null}
        {groupCount ? (
          <Text style={{ color: Colors.indigo[500] }}>
            {groupCount} {'more'}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const OWNER_FOLLOWER_TYPE_ID = '2cc468af-109b-4216-8119-542401e32f4d';
const OWNER_CONNECTION_REQUEST_TYPE_ID = '8ee62e9e-c224-47ad-b663-21851207f768';
const OWNER_CONNECTION_ACCEPTED_TYPE_ID = '79f0932a-056e-490b-8208-3a820ad7c321';

const FEED_NEW_CONTENT_TYPE_ID = 'ad695388-c2df-47a0-ad5b-fc9f9e1fffc9';
const FEED_NEW_REACTION_TYPE_ID = '37dae95d-e137-4bd4-b782-8512aaa2c96a';
const FEED_NEW_COMMENT_TYPE_ID = '1e08b70a-3826-4840-8372-18410bfc02c7';

const bodyFormer = (
  payload: PushNotification,
  hasMultiple: boolean,
  appName: string,
  senderName: string | undefined
) => {
  const sender = senderName || payload.senderId;

  if (payload.options.unEncryptedMessage) return payload.options.unEncryptedMessage;

  if (payload.options.appId === OWNER_APP_ID) {
    // Based on type, we show different messages
    if (payload.options.typeId === OWNER_FOLLOWER_TYPE_ID) {
      return `${sender} started following you`;
    } else if (payload.options.typeId === OWNER_CONNECTION_REQUEST_TYPE_ID) {
      return `${sender} sent you a connection request`;
    } else if (payload.options.typeId === OWNER_CONNECTION_ACCEPTED_TYPE_ID) {
      return `${sender} accepted your connection request`;
    }
  } else if (payload.options.appId === CHAT_APP_ID) {
    return `${sender} sent you ${hasMultiple ? 'multiple messages' : 'a message'}`;
  } else if (payload.options.appId === MAIL_APP_ID) {
    return `${sender} sent you ${hasMultiple ? 'multiple messages' : 'a message'}`;
  } else if (payload.options.appId === FEED_APP_ID) {
    if (payload.options.typeId === FEED_NEW_CONTENT_TYPE_ID) {
      return `${sender} posted to your feed`;
    } else if (payload.options.typeId === FEED_NEW_REACTION_TYPE_ID) {
      return `${sender} reacted to your post`;
    } else if (payload.options.typeId === FEED_NEW_COMMENT_TYPE_ID) {
      return `${sender} commented to your post`;
    }
  }

  return `${sender} sent you a notification via ${appName}`;
};

export const navigateOnNotification = (
  notification: PushNotification,
  identity: string,
  chatNavigator: NavigationProp<ChatStackParamList>,
  feedNavigator: NavigationProp<TabStackParamList>
) => {
  if (notification.options.appId === OWNER_APP_ID) {
    // Based on type, we show different messages
    if (
      [
        OWNER_FOLLOWER_TYPE_ID,
        OWNER_CONNECTION_REQUEST_TYPE_ID,
        OWNER_CONNECTION_ACCEPTED_TYPE_ID,
      ].includes(notification.options.typeId)
    ) {
      openURL(`https://${identity}/owner/connections/${notification.senderId}`);
    }
  } else if (notification.options.appId === CHAT_APP_ID) {
    chatNavigator.navigate('ChatScreen', { convoId: notification.options.typeId });
  } else if (notification.options.appId === MAIL_APP_ID) {
    // Navigate to owner console:
    openURL(`https://${identity}/apps/mail/${notification.options.typeId}`);
  } else if (notification.options.appId === FEED_APP_ID) {
    feedNavigator.navigate('Feed');
  } else {
    // You shouldn't come here
    Toast.show({
      type: 'error',
      text1: `Error Navigating to ${notification.options.appId}  `,
      text2: 'Blame the developer for not handling this case properly',
      onPress: () => {
        Clipboard.setString(notification.options.appId);
      },
    });
  }
};
