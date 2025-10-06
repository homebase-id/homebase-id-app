import { t } from 'homebase-id-app-common';
import { Platform, TouchableHighlight, View } from 'react-native';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useChatSettingsContext } from '../Settings/useChatSettingsContext';
import { Container } from '../ui/Container/Container';
import { Text } from '../ui/Text/Text';

const STARTER_MESSAGES = [
  { text: t('Hello 👋') },
  { text: t('Good to see you here! 😄') },
  { text: t('Let’s catch up! ☕') },
];

export const EmptyChatContainer = ({
  doSend,
  isMe,
}: {
  doSend: (message: { text: string }[]) => void;
  isMe?: boolean;
}) => {
  const { isDarkMode } = useDarkMode();
  const { useLegendList } = useChatSettingsContext();

  return (
    <Container
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        ...(useLegendList
          ? {}
          : {
              transform: [
                {
                  scaleY: -1,
                },
                {
                  scaleX: Platform.select({
                    android: -1,
                    default: 1,
                  }),
                },
              ], // Weird GiftedChat Style property that flips the empty component and STUPID REACT NATIVE
            }),
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '500',
          margin: 8,
        }}
      >
        {isMe ? t('Your Personal Space') : t('Chat is empty')}
      </Text>
      <Text
        style={{
          fontSize: 18,
          margin: 2,
          marginBottom: 16,
          textAlign: 'center',
          marginHorizontal: 16,
          color: isDarkMode ? Colors.slate[300] : Colors.slate[500],
        }}
      >
        {isMe
          ? t('Use this space to save your notes and important information')
          : t('Be the one to break the ice')}
      </Text>
      {STARTER_MESSAGES.map((message, index) => (
        <StarterBubbles
          key={index}
          text={message.text}
          onPress={() => doSend([{ text: message.text }])}
        />
      ))}
    </Container>
  );
};

const StarterBubbles = ({ text, onPress }: { text: string; onPress: () => void }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <TouchableHighlight
      style={{
        backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
        borderRadius: 10,
        margin: 6,
      }}
      underlayColor={isDarkMode ? Colors.slate[900] : Colors.slate[200]}
      onPress={onPress}
    >
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontSize: 16,
            fontWeight: '400',
          }}
        >
          {text}
        </Text>
      </View>
    </TouchableHighlight>
  );
};
