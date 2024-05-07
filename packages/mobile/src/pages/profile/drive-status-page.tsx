import { memo, useCallback, useState } from 'react';

import { useDrive } from '../../hooks/drive/useDrive';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { Container } from '../../components/ui/Container/Container';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary/ErrorBoundary';
import { ErrorNotification } from '../../components/ui/Alert/ErrorNotification';
import { Text } from '../../components/ui/Text/Text';
import { RefreshControl, StyleSheet } from 'react-native';
import { Colors } from '../../app/Colors';
import { ScrollView } from 'react-native-gesture-handler';
import { useDarkMode } from '../../hooks/useDarkMode';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';

export const DriveStatusPage = memo(() => {
  const { data: status, error, refetch } = useDrive(ChatDrive).getStatus;

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = useCallback(async () => {
    setRefreshing(true);

    await refetch();

    setRefreshing(false);
  }, [refetch]);

  if (!status) return;

  const inbox = status.inbox;
  const outbox = status.outbox;
  const sizeInfo = status.sizeInfo;

  return (
    <SafeAreaView>
      <ErrorBoundary>
        <ErrorNotification error={error} />
        <Container
          style={{
            flex: 1,
          }}
        >
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
          >
            <Text style={styles.header}>Inbox</Text>
            <InboxItems {...inbox} />
            <Text style={styles.header}>Outbox</Text>
            <OutBoxItems {...outbox} />
            <Text style={styles.header}>Size Info</Text>
            <SizeInfo {...sizeInfo} />
          </ScrollView>
        </Container>
      </ErrorBoundary>
    </SafeAreaView>
  );
});

const InboxItems = (inbox: {
  oldestItemTimestamp: number;
  poppedCount: number;
  totalItems: number;
}) => {
  const { isDarkMode } = useDarkMode();
  return (
    <>
      <Text style={styles.title}>
        Oldest Item Timestamp:{' '}
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {inbox.oldestItemTimestamp}
        </Text>
      </Text>
      <Text style={styles.title}>
        Popped Count:{' '}
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {inbox.poppedCount}
        </Text>
      </Text>
      <Text style={styles.title}>
        Total Items:{' '}
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {inbox.totalItems}
        </Text>
      </Text>
    </>
  );
};

const OutBoxItems = (outbox: {
  checkedOutCount: number;
  nextItemRun: number;
  totalItems: number;
}) => {
  const { isDarkMode } = useDarkMode();

  return (
    <>
      <Text style={styles.title}>
        Checked Out Count:{' '}
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {outbox.checkedOutCount}
        </Text>
      </Text>
      <Text style={styles.title}>
        Next Item Run:{' '}
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {outbox.nextItemRun}
        </Text>
      </Text>
      <Text style={styles.title}>
        Total Items:{' '}
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {outbox.totalItems}
        </Text>
      </Text>
    </>
  );
};

const SizeInfo = (sizeInfo: { fileCount: number; size: number }) => {
  const { isDarkMode } = useDarkMode();

  return (
    <>
      <Text style={styles.title}>
        File Count:{' '}
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {sizeInfo.fileCount}
        </Text>
      </Text>
      <Text style={styles.title}>
        Size:{' '}
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {sizeInfo.size}
        </Text>
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 22,
    fontWeight: '500',
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    color: Colors.slate[400],
  },
});
