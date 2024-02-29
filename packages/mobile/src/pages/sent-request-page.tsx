import {
  ActivityIndicator,
  Button,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '../app/Colors';
import { ExternalLink } from '../components/ui/Icons/icons';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useSentConnections } from 'feed-app-common';
import { Avatar } from '../components/ui/Chat/Conversation-tile';
import { useAuth } from '../hooks/auth/useAuth';

export const SentRequestPage = () => {
  const sentReq = useSentConnections({
    pageNumber: 1,
    pageSize: 20,
  }).fetch;

  const { getIdentity } = useAuth();

  return (
    <>
      {sentReq.isLoading && (
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
      {sentReq.isError && (
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
      {sentReq.data?.results.length ? (
        <FlatList
          data={sentReq.data.results}
          keyExtractor={(item) => item.senderOdinId + item.receivedTimestampMilliseconds}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                if (await InAppBrowser.isAvailable()) {
                  await InAppBrowser.open(
                    `https://${getIdentity()}/owner/connections/${
                      item.senderOdinId
                    }?ui=focus&return=homebasechat://`,
                    {
                      enableUrlBarHiding: false,
                      enableDefaultShare: false,
                    }
                  );
                } else {
                  Linking.openURL(
                    `https://${getIdentity()}/owner/connections/${
                      item.senderOdinId
                    }?ui=focus&return=homebasechat://`
                  );
                }
                await sentReq.refetch();
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
            No Sent requests
          </Text>
          <Button
            title="Refresh"
            onPress={() => {
              sentReq.refetch();
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
