import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FlatList, RefreshControl, View } from 'react-native';
import NoItems from '../../components/list/noItems';
import IdentityItem from '../../components/list/identityItem';
import { useCallback, useMemo, useState } from 'react';
import { HomeStackParamList } from '../../app/App';
import { usePendingConnections } from '../../hooks/connections/usePendingConnections';

type ConnectionRequestProps = NativeStackScreenProps<HomeStackParamList, 'ConnectionRequests'>;
export const ConnectionRequestsPage = (_props: ConnectionRequestProps) => {
  const { data: identities, refetch: refetchIdentities } = usePendingConnections().fetch;

  const flatIdentities = useMemo(() => identities && identities.results, [identities]);

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = useCallback(async () => {
    setRefreshing(true);

    await refetchIdentities();
    setRefreshing(false);
  }, [refetchIdentities]);

  return (
    <View style={{ position: 'relative', minHeight: '100%' }}>
      {flatIdentities?.length ? (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
          data={flatIdentities}
          renderItem={(item) => (
            <View
              key={item.item.senderOdinId}
              style={{
                padding: 1,
              }}
            >
              <IdentityItem odinId={item.item.senderOdinId} />
            </View>
          )}
        />
      ) : (
        <NoItems>You don&apos;t have any connection requests :-(</NoItems>
      )}
    </View>
  );
};
