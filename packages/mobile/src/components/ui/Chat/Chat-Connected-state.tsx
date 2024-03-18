import { DriveSearchResult } from '@youfoundation/js-lib/dist';
import { Conversation, GroupConversation } from '../../../provider/chat/ConversationProvider';
import { useDotYouClientContext, useIsConnected } from 'feed-app-common';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../Text/Text';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { ReactNode } from 'react';

export const ChatConnectedState = (conversation: DriveSearchResult<Conversation> | undefined) => {
  const { isDarkMode } = useDarkMode();
  if (!conversation) return null;
  const recipients = (conversation.fileMetadata.appData.content as GroupConversation).recipients;
  if (!recipients || recipients.length <= 1) return null;
  const recipientConnectedState = recipients.map((recipient) => {
    return <RecipientConnectedState recipient={recipient} key={recipient} />;
  });
  return (
    <View
      style={{
        backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
        ...styles.header,
      }}
    >
      {recipientConnectedState}
    </View>
  );
};

const RecipientConnectedState = ({ recipient }: { recipient: string }) => {
  const { data: isConnected, isFetched } = useIsConnected(recipient);
  const identity = useDotYouClientContext().getIdentity();

  if (isConnected || !isFetched) return null;
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          flex: 1,
          textAlign: 'justify',
          marginRight: 16,
        }}
      >
        You can only chat with connected identites, messages will not be delivered to{' '}
        <Text
          onPress={async () => {
            await Linking.openURL(`https://${recipient}`);
          }}
          style={{
            textDecorationLine: 'underline',
            fontWeight: '500',
          }}
        >
          {recipient}
        </Text>
      </Text>
      <Button
        onPress={async () => {
          await Linking.openURL(`https://${identity}/owner/connections/${recipient}/connect`);
        }}
      >
        <Text
          style={{
            color: Colors.white,
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          Connect
        </Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    zIndex: 10,
  },
});

const Button = (props: { children: ReactNode; disabled?: boolean; onPress: () => void }) => {
  return (
    <TouchableOpacity
      disabled={props.disabled}
      onPress={props.onPress}
      style={{
        backgroundColor: props.disabled ? Colors.slate[500] : Colors.indigo[500],
        padding: 8,
        borderRadius: 5,
      }}
    >
      {props.children}
    </TouchableOpacity>
  );
};