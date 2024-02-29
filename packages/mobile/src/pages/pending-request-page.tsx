import {
  ActivityIndicator,
  Button,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FlatList } from 'react-native-gesture-handler';
import { Avatar } from '../components/ui/Chat/Conversation-tile';
import { Colors } from '../app/Colors';
import { ExternalLink } from '../components/ui/Icons/icons';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { usePendingConnections } from 'feed-app-common';
import { useAuth } from '../hooks/auth/useAuth';

export const PendingRequestPage = () => {
  const pendingReq = usePendingConnections({
    pageNumber: 1,
    pageSize: 20,
  }).fetch;

  const { getIdentity } = useAuth();

  return (
    <>
      {pendingReq.isLoading && (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator />
        </View>
      )}
      {pendingReq.isError && (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text>Something went wrong</Text>
        </View>
      )}
      {pendingReq.data?.results.length ? (
        <FlatList
          data={pendingReq.data.results}
          keyExtractor={(item) => item.senderOdinId + item.receivedTimestampMilliseconds}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                if (await InAppBrowser.isAvailable()) {
                  await InAppBrowser.open(
                    `https://${getIdentity()}/owner/connections/${
                      item.senderOdinId
                    }?ui=focus&return=homebase-chat://`,
                    {
                      enableUrlBarHiding: false,
                      enableDefaultShare: false,
                    }
                  );
                } else {
                  Linking.openURL(
                    `https://${getIdentity()}/owner/connections/${
                      item.senderOdinId
                    }?ui=focus&return=homebase-chat://`
                  );
                }
                await pendingReq.refetch();
              }}
            >
              <View style={styles.tile}>
                <Avatar odinId={item.senderOdinId} style={styles.tinyLogo} />
                <View style={styles.content}>
                  <Text style={styles.title}>{item.senderOdinId}</Text>
                  <ExternalLink />
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 24,
              marginBottom: 16,
            }}
          >
            No pending requests
          </Text>
          <Button
            title="Refresh"
            onPress={() => {
              pendingReq.refetch();
            }}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.white,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginTop: 8,
    flexDirection: 'row',
    borderRadius: 5,
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexGrow: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  tinyLogo: {
    objectFit: 'cover',
    marginLeft: 12,
    width: 40,
    height: 40,
    borderRadius: 24,
  },
});
