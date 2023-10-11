import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ProfileStackParamList } from '../../app/App';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useFollowingInfinite } from '../../hooks/following/useFollowing';
import NoItems from '../../components/list/noItems';
import IdentityItem from '../../components/list/identityItem';

type FollowingProps = NativeStackScreenProps<
  ProfileStackParamList,
  'Following'
>;

const FollowingPage = (_props: FollowingProps) => {
  const {
    data: identities,
    hasNextPage: hasMoreIdentities,
    fetchNextPage,
    refetch: refetchIdentities,
  } = useFollowingInfinite({}).fetch;
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
        <NoItems>You're not following anyone :-(</NoItems>
      )}
    </View>
  );
};

export default FollowingPage;
