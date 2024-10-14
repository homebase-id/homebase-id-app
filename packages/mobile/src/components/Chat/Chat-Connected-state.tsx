import { HomebaseFile } from '@homebase-id/js-lib/core';
import { useDotYouClientContext, useIsConnected } from 'homebase-id-app-common';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { ReactNode, useState } from 'react';
import { openURL } from '../../utils/utils';
import { UnifiedConversation } from '../../provider/chat/ConversationProvider';
import Animated, {
  FadeOut,
  FadeOutLeft,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
  SlideOutLeft,
  SlideOutUp,
} from 'react-native-reanimated';
import TextButton from '../ui/Text/Text-Button';

export const ChatConnectedState = (conversation: HomebaseFile<UnifiedConversation> | undefined) => {
  const { isDarkMode } = useDarkMode();
  const identity = useDotYouClientContext().getIdentity();
  const [expanded, setExpanded] = useState(false);
  if (!conversation) return null;
  const recipients = conversation.fileMetadata.appData.content.recipients;
  if (!recipients || recipients.length <= 2) return null;
  const recipientConnectedState = recipients
    .filter((recipient) => recipient !== identity)
    .map((recipient) => {
      return <RecipientConnectedState recipient={recipient} key={recipient} />;
    });
  return (
    <Animated.View
      style={{
        backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
        ...styles.header,
      }}
      collapsable={false}
      entering={SlideInDown.withInitialValues({ originY: -100 })}
      layout={LinearTransition}
    >
      {recipientConnectedState.slice(0, expanded ? recipientConnectedState.length : 1)}
      {recipientConnectedState.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginBottom: 8,
          }}
        >
          <TextButton
            title={expanded ? 'Collapse' : 'Expand'}
            onPress={() => setExpanded(!expanded)}
          />
        </View>
      )}
    </Animated.View>
  );
};

const RecipientConnectedState = ({ recipient }: { recipient: string }) => {
  const { data: isConnected, isFetched } = useIsConnected(recipient);
  const identity = useDotYouClientContext().getIdentity();

  if (isConnected === null || isConnected || !isFetched) return null;
  return (
    <Animated.View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
      }}
      entering={SlideInDown.withInitialValues({ originY: 0 })}
      exiting={FadeOut}
    >
      <Text
        style={{
          flex: 1,
          textAlign: 'justify',
          marginRight: 16,
        }}
      >
        You can only chat with connected identities, messages will not be delivered to{' '}
        <Text
          onPress={async () => {
            await openURL(`https://${recipient}`);
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
          await openURL(`https://${identity}/owner/connections/${recipient}/connect`);
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    // flexDirection: 'row',
    // alignItems: 'center',
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
