import { FlatList } from 'react-native-gesture-handler';

import {
  ListRenderItemInfo,
  Platform,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { t, useAllConnections } from 'feed-app-common';
import { ChatStackParamList, NewChatStackParamList } from '../../app/ChatStack';
import { ContactTile, Tile } from '../../components/Contact/Contact-Tile';
import { People, Users } from '../../components/ui/Icons/icons';
import { useAuth } from '../../hooks/auth/useAuth';
import { memo, useCallback, useEffect, useState } from 'react';
import { DotYouProfile } from '@homebase-id/js-lib/network';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Text } from '../../components/ui/Text/Text';
import { openURL } from '../../utils/utils';
import { Colors } from '../../app/Colors';

const ListHeaderComponent = () => {
  const navigation = useNavigation<NavigationProp<NewChatStackParamList>>();
  return (
    <View style={{ marginTop: 3 }}>
      <Tile
        title="New Group"
        onClick={() => {
          navigation.navigate('NewGroup');
        }}
        icon={<Users size={'lg'} />}
      />
    </View>
  );
};

export const ContactPage = memo(
  ({ navigation }: { navigation: NavigationProp<NewChatStackParamList, 'NewChat'> }) => {
    const identity = useAuth().getIdentity();
    const { data: connections, refetch, status } = useAllConnections(true);
    const [refreshing, setRefreshing] = useState(false);
    const nav = useNavigation<NavigationProp<ChatStackParamList>>();

    useEffect(() => {
      if (status === 'success') {
        setRefreshing(false);
      }
    }, [status]);

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<DotYouProfile>) => (
        <ContactTile
          item={item}
          onOpen={(conversationId) => {
            navigation.goBack();
            setTimeout(() => {
              nav.navigate('ChatScreen', {
                convoId: conversationId,
              });
            }, 100);
          }}
        />
      ),
      [nav, navigation]
    );

    if (!connections) return null;

    return (
      <SafeAreaView>
        {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
        {connections && connections?.length ? (
          <FlatList
            data={connections}
            keyExtractor={(item) => item.odinId}
            ListHeaderComponent={ListHeaderComponent}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
          />
        ) : (
          <View style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Text style={{ color: Colors.gray[400], fontStyle: 'italic' }}>
              {t('To chat with someone on Homebase you need to be connected first.')}
            </Text>
            <TouchableOpacity
              style={{
                gap: 8,
                flexDirection: 'row',
                marginLeft: 'auto',
              }}
              onPress={() => openURL(`https://${identity}/owner/connections`)}
            >
              <Text>{t('Connect')}</Text>
              <People />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }
);
