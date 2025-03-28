import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useConversation } from '../../hooks/chat/useConversation';

import {
  ChatDrive,
  ConversationMetadata,
  ConversationWithYourselfId,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { Home } from '../../components/ui/Icons/icons';

import { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { Colors } from '../../app/Colors';
import { useAuth } from '../../hooks/auth/useAuth';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useProfile } from '../../hooks/profile/useProfile';
import { ConnectionName } from '../../components/ui/Name';
import { ChatStackParamList } from '../../app/ChatStack';
import { openURL } from '../../utils/utils';
import { Avatar, GroupAvatar, OwnerAvatar } from '../../components/ui/Avatars/Avatar';

import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import TextButton from '../../components/ui/Text/Text-Button';

export type ChatInfoProp = NativeStackScreenProps<ChatStackParamList, 'ChatInfo'>;

export const ChatInfoPage = memo((prop: ChatInfoProp) => {
  const { convoId: conversationId } = prop.route.params;
  const { data: conversation } = useConversation({ conversationId }).single;
  const conversationContent = conversation?.fileMetadata.appData.content;

  const { isDarkMode } = useDarkMode();
  const identity = useAuth().getIdentity();

  const recipients = conversationContent?.recipients.filter((recipient) => recipient !== identity);
  const recipient = recipients && recipients.length === 1 ? recipients[0] : undefined;

  const isGroup = recipients && recipients.length > 1;

  const goBack = useCallback(() => {
    return requestAnimationFrame(() => {
      prop.navigation.goBack();
    });
  }, [prop.navigation]);

  const headerLeft = useCallback(
    () => (
      <HeaderBackButton
        canGoBack={true}
        labelVisible={false}
        onPress={goBack}
        tintColor={isDarkMode ? Colors.white : Colors.black}
      />
    ),
    [goBack, isDarkMode]
  );

  const headerRight = useCallback(
    () =>
      conversationContent && 'version' in conversationContent && conversationContent.version ? (
        <TextButton
          title="Edit"
          unFilledStyle={{ marginRight: 8 }}
          onPress={() => {
            prop.navigation.navigate('EditGroup', {
              convoId: conversationId,
            });
          }}
        />
      ) : null,
    [conversationContent, conversationId, prop.navigation]
  );

  const headerStyle = useMemo(() => {
    return {
      backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
    };
  }, [isDarkMode]);
  const keyExtractor = useCallback((item: string) => item, []);
  const data = useMemo(
    () => [...(recipients as string[]), identity as string] as string[],
    [recipients, identity]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      if (!isGroup) return null;
      return <RenderRecipientTile recipient={item} isMe={index === data.length} />;
    },
    [data.length, isGroup]
  );
  if (!conversation) return null;

  const isAdmin = conversation.fileMetadata.senderOdinId === identity;

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <Header
        title={isGroup ? 'Group Info' : 'Chat Info'}
        headerLeft={headerLeft}
        headerRight={isGroup && isAdmin ? headerRight : undefined}
        headerStyle={headerStyle}
      />

      <FlatList
        data={data}
        ListHeaderComponent={
          <RenderListHeader
            isGroup={isGroup || false}
            recipient={recipient}
            conversation={conversation}
          />
        }
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </View>
  );
});

const RenderListHeader = memo(
  ({
    isGroup = false,
    recipient,
    conversation,
  }: {
    isGroup: boolean;
    conversation?: HomebaseFile<UnifiedConversation, ConversationMetadata>;
    recipient: string | undefined;
  }) => {
    const { isDarkMode } = useDarkMode();
    const colorStyle = useMemo(() => {
      return {
        color: isDarkMode ? Colors.white : Colors.black,
      };
    }, [isDarkMode]);

    const withYourself = stringGuidsEqual(
      conversation?.fileMetadata.appData.uniqueId,
      ConversationWithYourselfId
    );
    const identity = useAuth().getIdentity();

    const profile = useProfile().data;

    const onPress = useCallback(async () => {
      await openURL(`https://${withYourself ? identity : recipient}/`);
    }, [withYourself, identity, recipient]);
    if (!conversation) return null;
    const hasGroupImage =
      conversation.fileMetadata.payloads && conversation.fileMetadata.payloads?.length > 0;
    const groupAvatarPayloadKey = conversation.fileMetadata.payloads?.[0]?.key;
    const conversationContent = conversation?.fileMetadata.appData.content;

    return (
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
          <GroupAvatar
            fileId={conversation.fileId}
            fileKey={hasGroupImage ? groupAvatarPayloadKey : undefined}
            targetDrive={ChatDrive}
            previewThumbnail={conversation.fileMetadata.appData.previewThumbnail}
            imageStyle={{
              width: 81,
              height: 81,
            }}
            style={styles.avatar}
            iconSize={'2xl'}
          />
        )}
        {/* <Text
            style={{
              backgroundColor: Colors.indigo[500],
              color: Colors.white,
              padding: 5,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            Auto-connected
          </Text> */}
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
          </View>
        )}
      </View>
    );
  }
);

const RenderRecipientTile = memo(({ recipient, isMe }: { recipient: string; isMe: boolean }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <TouchableOpacity onPress={() => openURL(`https://${recipient}/`)}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          alignContent: 'center',
          width: '100%',
          padding: 8,
          paddingHorizontal: 12,
          marginTop: 8,
        }}
      >
        {/* NOTE : Last one's your identity so show the owner avatar */}
        {isMe ? (
          <OwnerAvatar style={styles.mediumAvatarSize} imageSize={styles.mediumAvatarSize} />
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
              color: isDarkMode ? Colors.white : Colors.black,
            },
          ]}
        >
          <ConnectionName odinId={recipient as string} />
          {isMe && <Text style={styles.you}> (you) </Text>}
        </Text>
      </View>
    </TouchableOpacity>
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
    marginVertical: 16,
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
