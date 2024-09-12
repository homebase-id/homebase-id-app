import { t } from 'feed-app-common';
import { Container } from '../ui/Container/Container';
import { Text } from '../ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { TouchableHighlight, View } from 'react-native';

const STARTER_MESSAGES = [
  { text: t('Hello 👋') },
  { text: t('Good to see you here! 😄') },
  { text: t('Let’s catch up! ☕') },
];

export const EmptyChatContainer = ({
  doSend,
}: {
  doSend: (message: { text: string }[]) => void;
}) => {
  const { isDarkMode } = useDarkMode();
  return (
    <Container
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scaleY: -1 }], // Weird GiftedChat Style property that flips the empty component upside down
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '500',
          margin: 8,
        }}
      >
        {t('Chat is empty')}
      </Text>
      <Text
        style={{
          fontSize: 18,
          margin: 2,
          marginBottom: 16,
          color: isDarkMode ? Colors.slate[300] : Colors.slate[500],
        }}
      >
        {t('Be the one to break the ice')}
      </Text>
      {STARTER_MESSAGES.map((message, index) => (
        <StarterBubbles
          key={index}
          text={message.text}
          onPress={() => doSend([{ text: message.text }])}
        />
      ))}
      {/* <StarterBubbles text={t('Hello 👋')} onPress={() => {}} /> */}
      {/* <StarterBubbles text={t('Good to see you here! 😄')} onPress={() => {}} /> */}
      {/* <StarterBubbles text={t('Let’s catch up! ☕')} onPress={() => {}} /> */}
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
