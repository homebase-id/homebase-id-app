import { HomebaseFile } from '@homebase-id/js-lib/core';
import { t, useDotYouClientContext, useIsConnected } from 'homebase-id-app-common';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from '../ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { ReactNode, useEffect, useState } from 'react';
import { openURL } from '../../utils/utils';
import { UnifiedConversation } from '../../provider/chat/ConversationProvider';
import Animated, {
  AnimatedStyle,
  FadeOut,
  LinearTransition,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import TextButton from '../ui/Text/Text-Button';
import { useAutoConnection } from '../../hooks/connections/useAutoConnection';

export const ChatConnectedState = (conversation: HomebaseFile<UnifiedConversation> | undefined) => {
  const { isDarkMode } = useDarkMode();
  const identity = useDotYouClientContext().getIdentity();
  const [expanded, setExpanded] = useState(false);
  const validRecipientsState = useSharedValue<string[]>([]);
  const sharedExpanded = useSharedValue<boolean>(false);

  useEffect(() => {
    sharedExpanded.value = expanded;
  }, [expanded, sharedExpanded]);

  const onValidRecipientStateChange = (value: string) => {
    // don't add duplicates
    if (validRecipientsState.value.includes(value)) return;
    validRecipientsState.value = [...validRecipientsState.value, value];
  };
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      display: validRecipientsState.value.length > 0 ? 'flex' : 'none',
    };
  });

  const animatedExpanderStyle = useAnimatedStyle(() => {
    return {
      display: validRecipientsState.value.length > 1 ? 'flex' : 'none',
      marginBottom: validRecipientsState.value.length > 1 ? 8 : 0,
    };
  });
  const animatedPropsStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scaleY: withTiming(sharedExpanded.value ? 1 : 0) }],
      opacity: sharedExpanded.value ? 1 : 0,
      height: sharedExpanded.value ? 'auto' : 0,
    };
  });
  if (!conversation) return null;
  const recipients = conversation.fileMetadata.appData.content.recipients;
  if (!recipients) return null;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
          ...styles.header,
        },
        animatedContainerStyle,
      ]}
      entering={SlideInDown.withInitialValues({ originY: -100 })}
      layout={LinearTransition}
    >
      {recipients
        .filter((recipient) => recipient !== identity)
        .map((recipient, index) => {
          return (
            <RecipientConnectedState
              recipient={recipient}
              key={recipient}
              onValidRecipientStateChange={onValidRecipientStateChange}
              animatedProps={index > 0 ? animatedPropsStyle : undefined}
            />
          );
        })}

      <Animated.View
        style={[
          {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginBottom: 8,
          },
          animatedExpanderStyle,
        ]}
      >
        <TextButton
          title={expanded ? 'Show less' : 'Show more'}
          onPress={() => setExpanded(!expanded)}
        />
      </Animated.View>
    </Animated.View>
  );
};

const StateWrapper = ({
  linkText,
  linkTarget,
  children,
  animatedProps,
}: {
  linkText: string;
  linkTarget: string;
  children: ReactNode;
  animatedProps?: AnimatedStyle<ViewStyle>;
}) => {
  return (
    <Animated.View
      style={[
        {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 3,
          borderBottomWidth: 0.5,
          borderBottomColor: Colors.slate[500],
        },
        animatedProps,
      ]}
      entering={SlideInDown.withInitialValues({ originY: 0 })}
      exiting={FadeOut}
    >
      <Text
        style={{
          flex: 1,
          // textAlign: 'justify',
          marginRight: 16,
        }}
        adjustsFontSizeToFit
        allowFontScaling
        dynamicTypeRamp="body"
        textBreakStrategy="simple"
        lineBreakMode="clip"
      >
        {children}
      </Text>
      <Button
        onPress={async () => {
          await openURL(linkTarget);
        }}
      >
        <Text
          style={{
            color: Colors.white,
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          {linkText}
        </Text>
      </Button>
    </Animated.View>
  );
};

const RecipientConnectedState = ({
  recipient,
  onValidRecipientStateChange,
  animatedProps,
}: {
  recipient: string;
  onValidRecipientStateChange: (value: string) => void;
  animatedProps?: AnimatedStyle<ViewStyle>;
}) => {
  const { data: isConnected, isFetched: isFetchedConnected } = useIsConnected(recipient);
  const { data: isUnconfirmed } = useAutoConnection({
    odinId: recipient,
  }).isUnconfirmedAutoConnected;

  const identity = useDotYouClientContext().getIdentity();

  useEffect(() => {
    if (!isConnected && isFetchedConnected) {
      onValidRecipientStateChange(recipient);
    }
    if (isUnconfirmed) {
      onValidRecipientStateChange(recipient);
    }
  }, [isConnected, isFetchedConnected, isUnconfirmed, onValidRecipientStateChange, recipient]);

  if (!isConnected && isFetchedConnected) {
    return (
      <StateWrapper
        linkText={t('Connect')}
        linkTarget={`https://${identity}/owner/connections/${recipient}/connect`}
        animatedProps={animatedProps}
      >
        {t('You can only chat with connected identities, messages will not be delivered to')}{' '}
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
      </StateWrapper>
    );
  }

  if (isUnconfirmed) {
    return (
      <StateWrapper
        linkText={t('Confirm')}
        linkTarget={`https://${identity}/owner/connections/${recipient}`}
        animatedProps={animatedProps}
      >
        {t('You were automatically connected to')}{' '}
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
        </Text>{' '}
        {t('because of an introduction. Would you like to confirm this connection?')}
      </StateWrapper>
    );
  }

  return null;
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
