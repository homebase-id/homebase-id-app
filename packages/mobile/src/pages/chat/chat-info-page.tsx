import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useConversation } from '../../hooks/chat/useConversation';

import { ConversationWithYourselfId } from '../../provider/chat/ConversationProvider';
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
import { ChatStackParamList } from '../../app/ChatStack';
import { openURL } from '../../utils/utils';
import { Avatar, GroupAvatar, OwnerAvatar } from '../../components/ui/Avatars/Avatar';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { stringGuidsEqual } from '@youfoundation/js-lib/helpers';

export type ChatInfoProp = NativeStackScreenProps<ChatStackParamList, 'ChatInfo'>;

export const ChatInfoPage = memo((prop: ChatInfoProp) => {
  const { convoId: conversationId } = prop.route.params;
  const { data: conversation } = useConversation({ conversationId }).single;
  const conversationContent = conversation?.fileMetadata.appData.content;

  const { isDarkMode } = useDarkMode();
  const identity = useAuth().getIdentity();
  const profile = useProfile().data;

  const recipients = conversationContent?.recipients.filter((recipient) => recipient !== identity);

  const withYourself = stringGuidsEqual(
    conversation?.fileMetadata.appData.uniqueId,
    ConversationWithYourselfId
  );
  const recipient = recipients && recipients.length === 1 ? recipients[0] : undefined;

  const onPress = useCallback(async () => {
    await openURL(`https://${withYourself ? identity : recipient}/`);
  }, [withYourself, identity, recipient]);

  const isGroup = recipients && recipients.length > 1;

  const headerLeft = useCallback(
    () => (
      <HeaderBackButton canGoBack={true} labelVisible={false} onPress={prop.navigation.goBack} />
    ),
    [prop.navigation.goBack]
  );

  const headerRight = useCallback(
    () =>
      (conversationContent as any).version ? (
        <TextButton
          title="Edit"
          style={{ marginRight: 8 }}
          onPress={() => {
            prop.navigation.navigate('EditGroup', {
              convoId: conversationId,
            });
          }}
        />
      ) : null,
    [conversationContent, conversationId, prop.navigation]
  );

  const colorStyle = useMemo(() => {
    return {
      color: isDarkMode ? Colors.white : Colors.black,
    };
  }, [isDarkMode]);
  const headerStyle = useMemo(() => {
    return {
      backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
    };
  }, [isDarkMode]);
  if (!conversation) return null;

  return (
    <>
      <Header
        title={isGroup ? 'Group Info' : 'Chat Info'}
        headerLeft={headerLeft}
        headerRight={isGroup ? headerRight : undefined}
        headerStyle={headerStyle}
      />
      <SafeAreaView>
        <View style={styles.content}>
          {!isGroup ? (
            withYourself ? (
              <OwnerAvatar style={styles.avatar} imageSize={styles.largeAvatarSize} />
            ) : (
              <Avatar
                odinId={recipient as string}
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
                marginTop: isGroup ? 0 : 24,
                ...colorStyle,
              },
            ]}
          >
            {withYourself ? (
              `${profile?.firstName} ${profile?.surName}`
            ) : isGroup ? (
              conversationContent?.title
            ) : (
              <ConnectionName odinId={recipient as string} />
            )}
          </Text>
          {!isGroup && (
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
                  {withYourself ? identity : (recipient as string)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {isGroup && (
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
              {[...recipients, identity as string].map((recipient, index) => (
                <TouchableOpacity key={index} onPress={() => openURL(`https://${recipient}/`)}>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignContent: 'center',
                      width: '100%',
                      padding: 8,
                      paddingLeft: 0,
                      marginTop: 8,
                    }}
                  >
                    {/* NOTE : Last one's your identity so show the owner avatar */}
                    {index === recipients?.length ? (
                      <OwnerAvatar
                        style={styles.mediumAvatarSize}
                        imageSize={styles.mediumAvatarSize}
                      />
                    ) : (
                      <Avatar
                        odinId={recipient as string}
                        style={styles.mediumAvatarSize}
                        imageSize={styles.mediumAvatarSize}
                      />
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
                      <ConnectionName odinId={recipient as string} />
                      {index === recipients?.length && <Text style={styles.you}> (you) </Text>}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
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
    borderRadius: 25,
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
