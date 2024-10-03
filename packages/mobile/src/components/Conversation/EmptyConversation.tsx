import { t, useAllContacts } from 'homebase-id-app-common';
import { memo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Text } from '../ui/Text/Text';
import { Colors } from '../../app/Colors';

import { ConversationTileWithYourself } from './ConversationTileWithYourself';
import { NoContacts } from '../Contact/NoContacts';

export const EmptyConversation = memo(
  ({ conversationsFetched }: { conversationsFetched: boolean }) => {
    const { data: contacts, refetch, isLoading } = useAllContacts(conversationsFetched);
    const noContacts = !isLoading && (!contacts || contacts.length === 0);
    const [refreshing, setRefreshing] = useState(false);

    const doRefresh = async () => {
      setRefreshing(true);
      await refetch();
      setRefreshing(false);
    };

    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} />}
        style={{ flex: 1 }}
      >
        <ConversationTileWithYourself />
        {noContacts ? (
          <NoContacts />
        ) : (
          <View style={{ padding: 16 }}>
            <Text style={{ color: Colors.gray[400], fontStyle: 'italic' }}>
              {t('No conversations found')}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  }
);
