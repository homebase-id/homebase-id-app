import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState, useCallback } from 'react';
import { ProfileStackParamList } from '../../app/App';
import { FlatList, Linking, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useFollowingInfinite } from '../../hooks/following/useFollowing';
import NoItems from '../../components/list/noItems';
import IdentityItem from '../../components/list/identityItem';
import { useDotYouClientContext } from 'feed-app-common';
import { ListRenderItemInfo } from 'react-native';

type FollowingProps = NativeStackScreenProps<ProfileStackParamList, 'Following'>;

export const FollowingPage = (_props: FollowingProps) => {
  const identity = useDotYouClientContext().getIdentity();

  const {
    data: identities,
    hasNextPage: hasMoreIdentities,
    fetchNextPage,
    refetch: refetchIdentities,
    isLoading: isLoadingIdentities,
  } = useFollowingInfinite({}).fetch;
  const flatIdentities = useMemo(
    () => (identities?.pages.flatMap((page) => page?.results).filter(Boolean) as string[]) ?? [],
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
      ) : isLoadingIdentities ? null : (
        <NoItems>You&apos;re not following anyone :-(</NoItems>
      )}
    </View>
  );
};
