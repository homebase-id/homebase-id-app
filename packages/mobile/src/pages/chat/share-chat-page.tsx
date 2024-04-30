import { type ListRenderItemInfo, StyleSheet, TouchableHighlight, View } from 'react-native';
import { ChatStackParamList } from '../../app/App';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useAllConnections } from 'feed-app-common';
import { useConversation } from '../../hooks/chat/useConversation';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { useCallback, useState } from 'react';
import { DotYouProfile } from '@youfoundation/js-lib/network';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import { GroupConversation } from '../../provider/chat/ConversationProvider';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ContactTile } from '../../components/Contact/Contact-Tile';
import { Text } from '../../components/ui/Text/Text';
import { Colors } from '../../app/Colors';
import { ListHeaderComponent, maxConnectionsForward } from '../../components/Chat/Chat-Forward';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { FlatList } from 'react-native-gesture-handler';
import { AuthorName } from '../../components/ui/Name';
import { SendChat } from '../../components/ui/Icons/icons';
import { ErrorNotification } from '../../components/ui/Alert/ErrorNotification';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { Image } from 'react-native';

export type ShareChatProp = NativeStackScreenProps<ChatStackParamList, 'ShareChat'>;

export const ShareChatPage = (prop: ShareChatProp) => {
  const { data, mimeType } = prop.route.params;
  const { isDarkMode } = useDarkMode();
  const { data: connections } = useAllConnections(true);
  const { mutateAsync: fetchConversation } = useConversation().create;
  const { mutate: sendMessage, error } = useChatMessage().send;
  const [selectedContact, setselectedContact] = useState<DotYouProfile[]>([]);
  const [selectedGroup, setselectedGroup] = useState<HomebaseFile<GroupConversation>[]>([]);
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

  const onShare = useCallback(async () => {
    if ((selectedContact.length === 0 && selectedGroup.length === 0) || !data) {
      navigation.goBack();
    }

    async function forwardMessages(conversationId: string, recipients: string[]) {
      let text = '';
      const imageSource: ImageSource[] = [];
      if (mimeType.startsWith('text')) {
        text = data;
      } else if (mimeType.startsWith('image')) {
        let size = {
          width: 0,
          height: 0,
        };
        await Image.getSize(data, (width, height) => (size = { width, height }));
        imageSource.push({
          uri: data,
          width: size.width,
          height: size.height,
          type: mimeType,
        });
      }
      return sendMessage({
        conversationId,
        recipients: recipients,
        message: text,
        files: imageSource,
      });
    }
    const promises: Promise<void>[] = [];
    if (selectedContact.length > 0) {
      promises.push(
        ...selectedContact.flatMap(async (contact) => {
          const { newConversationId: conversationId } = await fetchConversation({
            recipients: [contact.odinId],
          });

          return forwardMessages(conversationId, [contact.odinId]);
        })
      );
    }

    if (selectedGroup.length > 0) {
      promises.push(
        ...selectedGroup.flatMap((group) => {
          return forwardMessages(
            group.fileMetadata.appData.uniqueId as string,
            group.fileMetadata.appData.content.recipients
          );
        })
      );
    }

    await Promise.all(promises);
    if (promises.length === 1) {
      if (selectedContact.length === 1) {
        const contact = selectedContact[0];

        const { newConversationId: conversationId } = await fetchConversation({
          recipients: [contact.odinId],
        });
        navigation.navigate('ChatScreen', {
          convoId: conversationId,
        });
      }
      if (selectedGroup.length === 1) {
        const group = selectedGroup[0];
        navigation.navigate('ChatScreen', {
          convoId: group.fileMetadata.appData.uniqueId as string,
        });
      }
    } else {
      Toast.show({
        type: 'success',
        text1: 'Message sent successfully',
        position: 'bottom',
      });
    }
  }, [data, fetchConversation, mimeType, navigation, selectedContact, selectedGroup, sendMessage]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<DotYouProfile>) => (
      <>
        {index === 0 && (
          <Text
            style={{
              ...styles.headerText,
              textAlign: 'left',
              fontSize: 18,
              marginLeft: 16,
              marginTop: 16,
            }}
          >
            Contacts
          </Text>
        )}
        <ContactTile
          item={item}
          onPress={() => {
            if (selectedContact.includes(item)) {
              setselectedContact(selectedContact.filter((contact) => contact !== item));
            } else {
              if (selectedContact.length === maxConnectionsForward) {
                Toast.show({
                  type: 'error',
                  text1: `You can only forward to ${maxConnectionsForward} contacts at a time`,
                  position: 'bottom',
                  visibilityTime: 2000,
                });

                return;
              }
              setselectedContact([...selectedContact, item]);
            }
          }}
          isSelected={selectedContact.includes(item)}
          selectMode
        />
      </>
    ),
    [selectedContact]
  );

  const renderFooter = useCallback(
    () => (
      <View
        style={{
          position: 'absolute',
          bottom: 12,
          zIndex: 100,
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <View style={styles.namesContainer}>
          {selectedGroup.map((group) => {
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
                {group.fileMetadata.appData.content.title}
              </Text>
            );
          })}
          {selectedContact.map((contact) => {
            return (
              <Text
                key={contact.odinId}
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  borderRadius: 15,
                  backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[100],
                  padding: 10,
                  overflow: 'hidden',
                }}
              >
                <AuthorName odinId={contact.odinId} showYou />
              </Text>
            );
          })}
        </View>
        <TouchableHighlight
          underlayColor={Colors.slate[800]}
          onPress={onShare}
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
    ),
    [isDarkMode, onShare, selectedContact, selectedGroup]
  );

  return (
    <SafeAreaView>
      <ErrorNotification error={error} />
      <Image
        source={{
          uri: data,
        }}
        width={200}
        height={200}
      />
      <FlatList
        data={connections}
        renderItem={renderItem}
        keyExtractor={(item) => item.odinId}
        ListHeaderComponent={
          <ListHeaderComponent selectedGroup={selectedGroup} setselectedGroup={setselectedGroup} />
        }
      />
      {selectedContact.length > 0 || selectedGroup.length > 0 ? renderFooter() : undefined}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  footerText: {
    textAlign: 'center',
    color: Colors.white,
    fontWeight: '700',
  },
  headerText: {
    textAlign: 'center',
    margin: 6,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    borderRadius: 8,
    alignSelf: 'center',
    flex: 1,
  },
});
