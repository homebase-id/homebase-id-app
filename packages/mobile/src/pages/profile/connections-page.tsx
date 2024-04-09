import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ProfileStackParamList } from '../../app/App';
import {
  FlatList,
  RefreshControl,
  View,
  TouchableOpacity,
  Linking,
  ListRenderItemInfo,
} from 'react-native';
import { useConnections } from '../../hooks/connections/useConnections';
import NoItems from '../../components/list/noItems';
import IdentityItem from '../../components/list/identityItem';
import { useCallback, useMemo, useState } from 'react';
import { useDotYouClientContext } from 'feed-app-common';

type ConnectionsProps = NativeStackScreenProps<ProfileStackParamList, 'Connections'>;

export const ConnectionsPage = (_props: ConnectionsProps) => {
  const identity = useDotYouClientContext().getIdentity();

  const {
    data: identities,
    hasNextPage: hasMoreIdentities,
    fetchNextPage,
    refetch: refetchIdentities,
  } = useConnections({}).fetch;
  const flatIdentities = useMemo(
    () =>
      identities?.pages
        .flatMap((page) => page?.results)
        .map((profile) => profile?.odinId)
        .filter(Boolean) ?? [],
    [identities?.pages]
  );

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = useCallback(async () => {
    setRefreshing(true);

    await refetchIdentities();
    setRefreshing(false);
  }, [refetchIdentities]);

  const renderItem = useCallback(
    (item: ListRenderItemInfo<string>) => (
      <TouchableOpacity
        key={item.item}
        style={{
          padding: 1,
        }}
        onPress={() => Linking.openURL(`https://${identity}/owner/connections/${item.item}`)}
      >
        <IdentityItem odinId={item.item} key={item.item} />
      </TouchableOpacity>
    ),
    [identity]
  );

  return (
    <View style={{ position: 'relative', minHeight: '100%' }}>
      {flatIdentities?.length ? (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
          data={flatIdentities}
          renderItem={renderItem}
          onEndReached={() => hasMoreIdentities && fetchNextPage()}
        />
      ) : (
        <NoItems>You don&apos;t have any connections :-(</NoItems>
      )}
    </View>
  );
};
