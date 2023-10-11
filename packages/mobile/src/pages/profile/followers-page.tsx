import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ProfileStackParamList } from '../../app/App';
import { FlatList, RefreshControl, View } from 'react-native';
import { useFollowerInfinite } from '../../hooks/followers/useFollowers';
import NoItems from '../../components/list/noItems';
import IdentityItem from '../../components/list/identityItem';

type FollowersProps = NativeStackScreenProps<
  ProfileStackParamList,
  'Followers'
>;

const FollowersPage = (_props: FollowersProps) => {
  const {
    data: identities,
    hasNextPage: hasMoreIdentities,
    fetchNextPage,
    refetch: refetchIdentities,
  } = useFollowerInfinite({}).fetch;
  const flatIdentities =
    (identities?.pages
      .flatMap(page => page?.results)
      .filter(Boolean) as string[]) ?? [];

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = async () => {
    setRefreshing(true);

    // Refetch photos;
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
        <NoItems>You don't have any followers :-(</NoItems>
      )}
    </View>
  );
};

export default FollowersPage;
