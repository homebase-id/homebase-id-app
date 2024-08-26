import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FlatList, ListRenderItemInfo, RefreshControl, View } from 'react-native';
import NoItems from '../../components/list/noItems';
import IdentityItem from '../../components/list/identityItem';
import { useCallback, useMemo, useState } from 'react';
import { HomeStackParamList } from '../../app/App';
import { usePendingConnections } from '../../hooks/connections/usePendingConnections';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useDotYouClientContext } from 'feed-app-common';
import { RedactedConnectionRequest } from '@homebase-id/js-lib/network';
import { openURL } from '../../utils/utils';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';

type ConnectionRequestProps = NativeStackScreenProps<HomeStackParamList, 'ConnectionRequests'>;
export const ConnectionRequestsPage = (_props: ConnectionRequestProps) => {
  const identity = useDotYouClientContext().getIdentity();
  const {
    data: identities,
    refetch: refetchIdentities,
    isLoading: isLoadingIdentities,
  } = usePendingConnections().fetch;

  const flatIdentities = useMemo(() => identities && identities.results, [identities]);

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = useCallback(async () => {
    setRefreshing(true);

    await refetchIdentities();
    setRefreshing(false);
  }, [refetchIdentities]);

  const renderItem = useCallback(
    (item: ListRenderItemInfo<RedactedConnectionRequest>) => (
      <TouchableOpacity
        key={item.item.senderOdinId}
        style={{
          padding: 1,
        }}
        onPress={() => openURL(`https://${identity}/owner/connections/${item.item.senderOdinId}`)}
      >
        <IdentityItem odinId={item.item.senderOdinId} />
      </TouchableOpacity>
    ),
    [identity]
  );

  return (
    <SafeAreaView>
      <View style={{ position: 'relative', minHeight: '100%' }}>
        {flatIdentities?.length ? (
          <FlatList
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
            data={flatIdentities}
            renderItem={renderItem}
          />
        ) : isLoadingIdentities ? null : (
          <NoItems>You don&apos;t have any connection requests :-(</NoItems>
        )}
      </View>
    </SafeAreaView>
  );
};
