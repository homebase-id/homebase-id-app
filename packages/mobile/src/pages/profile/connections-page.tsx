import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ProfileStackParamList } from '../../app/App';
import { FlatList, RefreshControl, View } from 'react-native';
import { useConnections } from '../../hooks/connections/useConnections';
import NoItems from '../../components/list/noItems';
import IdentityItem from '../../components/list/identityItem';

type ConnectionsProps = NativeStackScreenProps<
  ProfileStackParamList,
  'Connections'
>;

const ConnectionsPage = (_props: ConnectionsProps) => {
  const {
    data: identities,
    hasNextPage: hasMoreIdentities,
    fetchNextPage,
    refetch: refetchIdentities,
  } = useConnections({}).fetch;
  const flatIdentities =
    identities?.pages
      .flatMap(page => page?.results)
      .map(profile => profile?.odinId)
      .filter(Boolean) ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = async () => {
    setRefreshing(true);

    await refetchIdentities();
    setRefreshing(false);
  };

  return (
    <View style={{ position: 'relative', minHeight: '100%' }}>
      {flatIdentities?.length ? (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={doRefresh} />
          }
          data={flatIdentities}
          renderItem={item => (
            <View
              key={item.item}
              style={{
                padding: 1,
              }}>
              <IdentityItem odinId={item.item} key={item.item} />
            </View>
          )}
          onEndReached={() => hasMoreIdentities && fetchNextPage()}
        />
      ) : (
        <NoItems>You don't have any connections :-(</NoItems>
      )}
    </View>
  );
};

export default ConnectionsPage;
