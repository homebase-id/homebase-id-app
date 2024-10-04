import { StyleSheet, TouchableHighlight, View } from 'react-native';
import { Input } from '../../components/ui/Form/Input';
import { Colors } from '../../app/Colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatStackParamList } from '../../app/ChatStack';
import { useCallback, useState } from 'react';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { LinkPreviewBar } from '../../components/Chat/Link-Preview-Bar';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { SendChat } from '../../components/ui/Icons/icons';
import { Text } from '../../components/ui/Text/Text';
import { AuthorName } from '../../components/ui/Name';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDarkMode } from '../../hooks/useDarkMode';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { getNewId } from '@homebase-id/js-lib/helpers';
import { StackActions } from '@react-navigation/native';

export type ShareChatProp = NativeStackScreenProps<ChatStackParamList, 'ShareEditor'>;
export const ShareEditorPage = ({ navigation, route }: ShareChatProp) => {
  const { text: initialText, recipients } = route.params;
  const [text, setText] = useState(initialText);
  const [linkData, setLinkData] = useState<LinkPreview | undefined>();
  const { mutate: sendMessage } = useChatMessage().send;
  const { bottom } = useSafeAreaInsets();
  const { isDarkMode } = useDarkMode();

  const onSend = useCallback(() => {
    for (const group of recipients) {
      sendMessage({
        message: text,
        conversation: group,
        linkPreviews: linkData ? [linkData] : [],
        chatId: getNewId(),
        userDate: new Date().getTime(),
      });
    }
    navigation.dispatch(StackActions.replace('Conversation'));
  }, [linkData, navigation, recipients, sendMessage, text]);

  return (
    <SafeAreaView>
      <View
        style={{
          marginHorizontal: 12,
        }}
      >
        <LinkPreviewBar
          textToSearchIn={text}
          onDismiss={() => setLinkData(undefined)}
          onLinkData={(data) => setLinkData(data)}
        />
        <Input
          multiline
          placeholder="Type your message here"
          value={initialText}
          onChangeText={(e) => setText(e)}
          autoFocus
        />
      </View>
      <View
        style={{
          position: 'absolute',
          bottom: bottom,
          zIndex: 100,
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <View style={styles.namesContainer}>
          {recipients.map((group) => {
            const isSingleConversation = group.fileMetadata.appData.content.recipients.length === 2;
            return (
              <Text
                key={group.fileId}
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  borderRadius: 15,
                  backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
                  padding: 10,
                  overflow: 'hidden',
                }}
              >
                {!isSingleConversation ? (
                  group.fileMetadata.appData.content.title
                ) : (
                  <AuthorName odinId={group.fileMetadata.appData.content.recipients[0]} />
                )}
              </Text>
            );
          })}
        </View>
        <TouchableHighlight
          underlayColor={Colors.slate[800]}
          onPress={onSend}
          style={styles.footerContainer}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <Text style={styles.footerText}>Send</Text>
            <View
              style={{
                transform: [{ rotate: '50deg' }],
              }}
            >
              <SendChat color={Colors.white} />
            </View>
          </View>
        </TouchableHighlight>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  footerText: {
    textAlign: 'center',
    color: Colors.white,
    fontWeight: '700',
  },
  footerContainer: {
    padding: 12,
    margin: 12,
    alignSelf: 'flex-end',
    borderRadius: 12,
    backgroundColor: '#80f',
  },
  namesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginLeft: 12,
    overflow: 'hidden',
    flexWrap: 'wrap',
  },
});
