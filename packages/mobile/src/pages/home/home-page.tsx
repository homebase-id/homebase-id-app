import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../components/ui/Container/Container';

import { TabStackParamList } from '../../app/App';
import { t } from 'homebase-id-app-common';
import { useMemo, useCallback, useRef } from 'react';
import { View, TouchableOpacity, ListRenderItemInfo, FlatList } from 'react-native';
import { Dashboard } from '../../components/Dashboard/Dashboard';
import { ProfileInfo } from '../../components/Profile/ProfileInfo';
import { ErrorNotification } from '../../components/ui/Alert/ErrorNotification';
import { Times } from '../../components/ui/Icons/icons';
import { usePushNotifications } from '../../hooks/notifications/usePushNotifications';
import { PushNotification } from '@homebase-id/js-lib/core';
import { NotificationDay } from '../../components/Dashboard/NotificationsOverview';
import { useScrollToTop } from '@react-navigation/native';
import { Text } from '../../components/ui/Text/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeProps = NativeStackScreenProps<TabStackParamList, 'Home'>;

export const HomePage = (_props: HomeProps) => {
  const { data: notifications, hasNextPage, fetchNextPage } = usePushNotifications().fetch;
  const flattenedNotifications = useMemo(
    () => notifications?.pages.flatMap((page) => page.results) || [],
    [notifications]
  );

  const groupedNotificationsPerDay = useMemo(
    () =>
      flattenedNotifications?.reduce(
        (acc, notification) => {
          const date = new Date(notification.created).toDateString();

          if (acc[date]) acc[date].push(notification);
          else acc[date] = [notification];

          return acc;
        },
        {} as { [key: string]: PushNotification[] }
      ) || {},
    [flattenedNotifications]
  );

  const scrollRef = useRef<FlatList<string>>(null);
  useScrollToTop(scrollRef);

  const { mutate: remove, error: removeError } = usePushNotifications().remove;
  const doClearAll = useCallback(
    () => remove(flattenedNotifications.map((n) => n.id) || []),
    [flattenedNotifications, remove]
  );

  const renderHeader = useCallback(
    () => (
      <Container>
        <ProfileInfo />
        <Dashboard />
        {flattenedNotifications.length ? (
          <View style={{ display: 'flex', flexDirection: 'row-reverse' }}>
            <TouchableOpacity
              onPress={doClearAll}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <Times size={'sm'} />
              <Text>{t('Clear All')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Container>
    ),
    [doClearAll, flattenedNotifications]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<string>) => (
      <NotificationDay day={new Date(item)} notifications={groupedNotificationsPerDay[item]} />
    ),
    [groupedNotificationsPerDay]
  );

  const { top, bottom } = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Container style={{ flex: 1, paddingTop: top, paddingBottom: bottom }}>
        <FlatList
          ref={scrollRef}
          data={Object.keys(groupedNotificationsPerDay)}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 8 }}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          onEndReached={() => hasNextPage && fetchNextPage()}
        />
        <ErrorNotification error={removeError} />
      </Container>
    </SafeAreaView>
  );
};
