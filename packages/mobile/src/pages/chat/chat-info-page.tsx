import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useConversation } from '../../hooks/chat/useConversation';
import { Avatar, GroupAvatar, OwnerAvatar } from '../../components/Chat/Conversation-tile';
import {
  ConversationWithYourselfId,
  GroupConversation,
  SingleConversation,
} from '../../provider/chat/ConversationProvider';
import { Home } from '../../components/ui/Icons/icons';

import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { Colors } from '../../app/Colors';
import { useAuth } from '../../hooks/auth/useAuth';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import TextButton from '../../components/ui/Text/Text-Button';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useProfile } from '../../hooks/profile/useProfile';
import { ConnectionName } from '../../components/ui/Name';
import { ChatStackParamList } from '../../app/App';
import { openURL } from '../../utils/utils';

export type ChatInfoProp = NativeStackScreenProps<ChatStackParamList, 'ChatInfo'>;

export const ChatInfoPage = memo((prop: ChatInfoProp) => {
  const { convoId: conversationId } = prop.route.params;
  const { data: conversation } = useConversation({ conversationId }).single;
  const { isDarkMode } = useDarkMode();
  const identity = useAuth().getIdentity();
  const profile = useProfile().data;

  const isSelf = conversationId === ConversationWithYourselfId;

  const onPress = useCallback(async () => {
    const recipient = isSelf
      ? identity
      : (conversation?.fileMetadata.appData.content as SingleConversation).recipient;
    const url = `https://${recipient}/`;
    await openURL(url);
  }, [conversation?.fileMetadata.appData.content, isSelf, identity]);

  const group =
    (conversation && 'recipients' in conversation.fileMetadata.appData.content) || false;

  const headerLeft = useCallback(
    () => (
      <HeaderBackButton canGoBack={true} labelVisible={false} onPress={prop.navigation.goBack} />
    ),
    [prop.navigation.goBack]
  );

  const headerRight = useCallback(
    () => (
      <TextButton
        title="Edit"
        style={{ marginRight: 8 }}
        onPress={() => {
          prop.navigation.navigate('EditGroup', {
            convoId: conversationId,
          });
        }}
      />
    ),
    [conversationId, prop.navigation]
  );

  const recipientGroupStyle = useMemo(() => {
    return {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      alignContent: 'center',
      backgroundColor: isDarkMode ? Colors.slate[900] : Colors.white,
      width: '100%',
      padding: 8,
      paddingLeft: 0,
      marginTop: 8,
    } as ViewStyle;
  }, [isDarkMode]);

  const colorStyle = useMemo(() => {
    return {
      color: isDarkMode ? Colors.white : Colors.black,
    };
  }, [isDarkMode]);

  if (!conversation) return null;

  const conversationContent = conversation.fileMetadata.appData.content;

  return (
    <>
      <Header
        title={group ? 'Group Info' : 'Chat Info'}
        headerLeft={headerLeft}
        headerRight={group ? headerRight : undefined}
      />
      <View style={styles.content}>
        {!group ? (
          isSelf ? (
            <OwnerAvatar style={styles.avatar} imageSize={styles.largeAvatarSize} />
          ) : (
            <Avatar
              odinId={(conversationContent as SingleConversation).recipient}
              style={styles.avatar}
              imageSize={styles.largeAvatarSize}
            />
          )
        ) : (
          <GroupAvatar style={styles.avatar} iconSize={'2xl'} />
        )}
        <Text
          style={[
            styles.title,
            {
              marginTop: group ? 0 : 24,
              ...colorStyle,
            },
          ]}
        >
          {isSelf ? (
            `${profile?.firstName} ${profile?.surName}`
          ) : group ? (
            conversationContent.title
          ) : (
            <ConnectionName odinId={(conversationContent as SingleConversation).recipient} />
          )}
        </Text>
        {!group && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
            }}
          >
            <Home />
            <TouchableOpacity onPress={onPress}>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: isDarkMode ? Colors.purple[300] : Colors.purple[800],
                  },
                ]}
              >
                {isSelf ? identity : (conversationContent as SingleConversation).recipient}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {group && (
          <View style={styles.groupRecipient}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '500',
                ...colorStyle,
              }}
            >
              Recipients
            </Text>
            {[...(conversationContent as GroupConversation).recipients, identity as string].map(
              (recipient, index) => (
                <View key={index} style={recipientGroupStyle}>
                  {index === (conversationContent as GroupConversation).recipients.length ? (
                    <OwnerAvatar style={styles.mediumAvatarSize} />
                  ) : (
                    <Avatar odinId={recipient} style={styles.mediumAvatarSize} />
                  )}
                  <Text
                    style={[
                      {
                        fontWeight: '400',
                        fontSize: 18,
                        marginLeft: 12,
                        ...colorStyle,
                      },
                    ]}
                  >
                    <ConnectionName odinId={recipient} />
                    <Text style={styles.you}>
                      {index === (conversationContent as GroupConversation).recipients.length
                        ? ' (you)'
                        : null}
                    </Text>
                  </Text>
                </View>
              )
            )}
          </View>
        )}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 81,
    height: 81,
    borderRadius: 50,
    margin: 16,
  },
  largeAvatarSize: {
    width: 81,
    height: 81,
  },
  mediumAvatarSize: {
    width: 50,
    height: 50,
  },
  you: {
    fontSize: 16,
    color: Colors.slate[500],
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  groupRecipient: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 8,
    marginLeft: 8,
  },
});
