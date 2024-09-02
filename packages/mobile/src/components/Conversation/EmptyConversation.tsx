import { t, useAllContacts, useDotYouClientContext } from 'feed-app-common';
import { memo, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '../ui/Text/Text';
import { Colors } from '../../app/Colors';
import { openURL } from '../../utils/utils';
import { People } from '../ui/Icons/icons';
import { ConversationTileWithYourself } from './ConversationTileWithYourself';

export const EmptyConversation = memo(
  ({ conversationsFetched }: { conversationsFetched: boolean }) => {
    const identity = useDotYouClientContext().getIdentity();
    const { data: contacts, refetch,isLoading } = useAllContacts(conversationsFetched);
    const noContacts = !isLoading &&  (!contacts || contacts.length === 0);
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
