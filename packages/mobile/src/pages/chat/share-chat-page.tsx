import {
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  TouchableHighlight,
  View,
} from 'react-native';
import { ChatStackParamList } from '../../app/ChatStack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useAllConnections } from 'feed-app-common';
import { useConversation } from '../../hooks/chat/useConversation';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { useCallback, useMemo, useState } from 'react';
import { DotYouProfile } from '@youfoundation/js-lib/network';
import { HomebaseFile } from '@youfoundation/js-lib/core';
import {
  ConversationWithYourself,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { NavigationProp, StackActions, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ContactTile } from '../../components/Contact/Contact-Tile';
import { Text } from '../../components/ui/Text/Text';
import { Colors } from '../../app/Colors';
import { ListHeaderComponent, maxConnectionsForward } from '../../components/Chat/Chat-Forward';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { AuthorName } from '../../components/ui/Name';
import { SendChat } from '../../components/ui/Icons/icons';
import { ErrorNotification } from '../../components/ui/Alert/ErrorNotification';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { fixContentURI, getImageSize } from '../../utils/utils';
import {
  ConversationWithRecentMessage,
  useConversationsWithRecentMessage,
} from '../../hooks/chat/useConversationsWithRecentMessage';
import ConversationTile from '../../components/Chat/Conversation-tile';
import { getNewId } from '@youfoundation/js-lib/helpers';
import { ConversationTileWithYourself } from '../conversations-page';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ShareChatProp = NativeStackScreenProps<ChatStackParamList, 'ShareChat'>;
export const ShareChatPage = (prop: ShareChatProp) => {
  const { data, mimeType } = prop.route.params;
  const { isDarkMode } = useDarkMode();

  const { mutateAsync: createConversation } = useConversation().create;
  const { mutate: sendMessage, error } = useChatMessage().send;

  const { data: connections } = useAllConnections(true);
  const { data: allConversations } = useConversationsWithRecentMessage().all;

  const [selectedContact, setSelectedContact] = useState<DotYouProfile[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    HomebaseFile<UnifiedConversation>[]
  >([]);
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

  const onSelectConversation = useCallback(
    (conversation: HomebaseFile<UnifiedConversation>) => {
      setSelectedConversation((selectedConversation) => {
        if (selectedConversation.includes(conversation)) {
          return selectedConversation.filter((c) => c !== conversation);
        } else {
          if (selectedContact.length + selectedConversation.length === maxConnectionsForward) {
            Toast.show({
              type: 'info',
              text1: `You can only forward to ${maxConnectionsForward} contacts at a time`,
              position: 'bottom',
              visibilityTime: 2000,
            });

            return selectedConversation;
          }
          return [...selectedConversation, conversation];
        }
      });
    },
    [setSelectedConversation, selectedContact.length]
  );

  const onSelectContact = useCallback(
    (contact: DotYouProfile) => {
      setSelectedContact((selectedContact) => {
        if (selectedContact.includes(contact)) {
          return selectedContact.filter((c) => c !== contact);
        } else {
          if (selectedContact.length + selectedConversation.length === maxConnectionsForward) {
            Toast.show({
              type: 'info',
              text1: `You can only forward to ${maxConnectionsForward} contacts at a time`,
              position: 'bottom',
              visibilityTime: 2000,
            });

            return selectedContact;
          }
          return [...selectedContact, contact];
        }
      });
    },
    [setSelectedContact, selectedConversation.length]
  );

  const onShare = useCallback(async () => {
    if ((selectedContact.length === 0 && selectedConversation.length === 0) || !data) {
      navigation.goBack();
    }

    async function forwardMessages(conversation: HomebaseFile<UnifiedConversation>) {
      let text = '';
      const imageSource: ImageSource[] = [];
      if (mimeType.startsWith('text')) {
        text = data;
      } else if (mimeType.startsWith('image')) {
        const uri = await fixContentURI(data);
        let size = {
          width: 0,
          height: 0,
        };
        await getImageSize(uri).then((res) => {
          if (res instanceof Error) {
            size = { width: 500, height: 500 };
            return;
          }
          size = res;
        });
        imageSource.push({
          uri: uri,
          width: size.width,
          height: size.height,
          type: mimeType,
        });
      } else if (mimeType.startsWith('video')) {
        const uri = await fixContentURI(data);
        imageSource.push({
          uri: uri,
          width: 1920,
          height: 1080,
          type: mimeType,
        });
      } else if (mimeType.startsWith('application/pdf')) {
        const uri = await fixContentURI(data);
        imageSource.push({
          uri: uri,
          type: mimeType,
          width: 0,
          height: 0,
        });
      }
      //TODO: Handle a case where if a conversation doesn't exist and a command needs to be sent
      return sendMessage({
        conversation,
        message: text,
        files: imageSource,
        chatId: getNewId(),
        userDate: new Date().getTime(),
      });
    }
    const promises: Promise<void>[] = [];
    if (selectedContact.length > 0) {
      promises.push(
        ...selectedContact.flatMap(async (contact) => {
          const conversation = await createConversation({
            recipients: [contact.odinId],
          });

          return forwardMessages(conversation);
        })
      );
    }

    if (selectedConversation.length > 0) {
      promises.push(
        ...selectedConversation.flatMap((conversation) => {
          return forwardMessages(conversation);
        })
      );
    }

    await Promise.all(promises);
    if (promises.length === 1) {
      if (selectedContact.length === 1) {
        const contact = selectedContact[0];

        // TODO: needs to change to fetch instead of still trying to create
        const conversation = await createConversation({
          recipients: [contact.odinId],
        });
        navigation.dispatch(
          StackActions.replace('ChatScreen', {
            convoId: conversation.fileMetadata.appData.uniqueId as string,
          })
        );
      }
      if (selectedConversation.length === 1) {
        const group = selectedConversation[0];
        navigation.dispatch(
          StackActions.replace('ChatScreen', {
            convoId: group.fileMetadata.appData.uniqueId as string,
          })
        );
      }
    } else {
      Toast.show({
        type: 'success',
        text1: 'Message sent successfully',
        position: 'bottom',
      });
      navigation.goBack();
    }
  }, [
    data,
    createConversation,
    mimeType,
    navigation,
    selectedContact,
    selectedConversation,
    sendMessage,
  ]);

  const renderItem = useCallback(
    ({
      item,
      section,
    }: SectionListRenderItemInfo<
      ConversationWithRecentMessage | DotYouProfile,
      | {
          id: string;
          title: string;
          data: ConversationWithRecentMessage[] | undefined;
        }
      | {
          id: string;
          title: string;
          data: DotYouProfile[] | undefined;
        }
      | undefined
    >) => {
      if (section.id === 'recent') {
        if (section.data.length === 0) {
          return null;
        }
        const conversation = item as unknown as ConversationWithRecentMessage;
        return (
          <ConversationTile
            conversation={conversation.fileMetadata.appData.content}
            conversationId={conversation.fileMetadata.appData.uniqueId}
            selectMode
            isSelected={selectedConversation.includes(conversation)}
            onPress={() => onSelectConversation(conversation)}
            odinId={conversation.fileMetadata.appData.content.recipients[0]}
          />
        );
      }

      if (section.id === 'contacts') {
        const contact = item as unknown as DotYouProfile;
        if (contact.odinId === 'pippin.dotyou.cloud') {
          console.log('render pippin');
        }
        return (
          <ContactTile
            item={contact}
            onPress={() => onSelectContact(contact)}
            isSelected={selectedContact.includes(contact)}
            selectMode
          />
        );
      }
      return null;
    },
    [onSelectContact, onSelectConversation, selectedContact, selectedConversation]
  );

  const { bottom } = useSafeAreaInsets();

  const renderFooter = useCallback(
    () => (
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
          {selectedConversation.map((group) => {
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
    [bottom, isDarkMode, onShare, selectedContact, selectedConversation]
  );

  const sectionData = useMemo((): ReadonlyArray<
    SectionListData<
      ConversationWithRecentMessage | DotYouProfile,
      | {
          id: string;
          title: string;
          data: ConversationWithRecentMessage[] | undefined;
        }
      | {
          id: string;
          title: string;
          data: DotYouProfile[] | undefined;
        }
      | undefined
    >
  > => {
    if (!connections || !allConversations) {
      return [];
    }

    return [
      {
        id: 'recent',
        title: 'Recents',
        data: allConversations?.slice(0, 5) || [], // Show top 5 recent conversations
        keyExtractor: (item) => (item as ConversationWithRecentMessage).fileId,
      },
      {
        id: 'contacts',
        title: 'Contacts',
        data: connections || [],
        keyExtractor: (item) => (item as DotYouProfile).odinId,
      },
    ];
  }, [connections, allConversations]);

  const renderSectionHeader = useCallback(
    ({
      section: { title },
    }: {
      section: SectionListData<
        ConversationWithRecentMessage | DotYouProfile,
        | {
            id: string;
            title: string;
            data: ConversationWithRecentMessage[] | undefined;
          }
        | {
            id: string;
            title: string;
            data: DotYouProfile[] | undefined;
          }
        | undefined
      >;
    }) => {
      return (
        <Text
          style={{
            ...styles.headerText,
            textAlign: 'left',
            fontSize: 18,
            marginLeft: 16,
            marginTop: 16,
          }}
        >
          {title}
        </Text>
      );
    },
    []
  );

  return (
    <SafeAreaView>
      <ErrorNotification error={error} />
      <SectionList
        sections={sectionData}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <ConversationTileWithYourself
            selecMode
            isSelected={selectedConversation.includes(ConversationWithYourself)}
            onPress={() => onSelectConversation(ConversationWithYourself)}
          />
        }
        ListFooterComponent={
          //Actually a Group Component
          <ListHeaderComponent
            selectedGroup={selectedConversation}
            setselectedGroup={setSelectedConversation}
          />
        }
        ListFooterComponentStyle={{
          paddingBottom: 100,
        }}
      />
      {selectedContact.length > 0 || selectedConversation.length > 0 ? renderFooter() : undefined}
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
