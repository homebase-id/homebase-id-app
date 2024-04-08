import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { ProfileStackParamList } from '../../app/App';
import { FlatList, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useFollowerInfinite } from '../../hooks/followers/useFollowers';
import NoItems from '../../components/list/noItems';
import IdentityItem from '../../components/list/identityItem';
import { useDotYouClientContext } from 'feed-app-common';
import { openURL } from '../../utils/utils';

type FollowersProps = NativeStackScreenProps<ProfileStackParamList, 'Followers'>;

export const FollowersPage = (_props: FollowersProps) => {
  const identity = useDotYouClientContext().getIdentity();

  const {
    data: identities,
    hasNextPage: hasMoreIdentities,
    fetchNextPage,
    refetch: refetchIdentities,
  } = useFollowerInfinite({}).fetch;
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

  return (
    <View style={{ position: 'relative', minHeight: '100%' }}>
      {flatIdentities?.length ? (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
          data={flatIdentities}
          renderItem={(item) => (
            <TouchableOpacity
              key={item.item}
              style={{
                padding: 1,
              }}
              onPress={() => openURL(`https://${identity}/owner/connections/${item.item}`)}
            >
              <IdentityItem odinId={item.item} key={item.item} />
            </TouchableOpacity>
          )}
          onEndReached={() => hasMoreIdentities && fetchNextPage()}
        />
      ) : (
        <NoItems>You don&apos;t have any followers :-(</NoItems>
      )}
    </View>
  );
};
