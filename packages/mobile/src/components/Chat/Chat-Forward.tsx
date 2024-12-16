import {
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  BottomSheetSectionList,
  BottomSheetTextInput,
  TouchableHighlight,
} from '@gorhom/bottom-sheet';
import { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import { Text } from '../ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { t, useAllConnections } from 'homebase-id-app-common';
import {
  ActivityIndicator,
  Platform,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { DotYouProfile } from '@homebase-id/js-lib/network';
import { ContactTile } from '../Contact/Contact-Tile';
import { CheckCircle, CircleOutlined, SendChat } from '../ui/Icons/icons';
import { AuthorName } from '../ui/Name';
import Toast from 'react-native-toast-message';
import { useConversation } from '../../hooks/chat/useConversation';
import { useChatMessage } from '../../hooks/chat/useChatMessage';
import { ChatMessageIMessage } from './ChatDetail';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ChatStackParamList } from '../../app/ChatStack';
import { ErrorNotification } from '../ui/Alert/ErrorNotification';
import useImage from '../ui/OdinImage/hooks/useImage';
import {
  ChatDrive,
  ConversationWithYourself,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { useConversations } from '../../hooks/chat/useConversations';
import { EmbeddedThumb, HomebaseFile } from '@homebase-id/js-lib/core';
import { GroupAvatar } from '../ui/Avatars/Avatar';
import { getNewId } from '@homebase-id/js-lib/helpers';
import { useAudio } from '../ui/OdinAudio/hooks/useAudio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideo } from '../../hooks/video/useVideo';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { Backdrop } from '../ui/Modal/Backdrop';
import { useErrors } from '../../hooks/errors/useErrors';
import { getImageSize } from '../../utils/utils';
import {
  ConversationWithRecentMessage,
  useConversationsWithRecentMessage,
} from '../../hooks/chat/useConversationsWithRecentMessage';
import ConversationTile from './Conversation-tile';
import { ConversationTileWithYourself } from '../Conversation/ConversationTileWithYourself';
import { SearchConversationWithSelectionResults } from './SearchConversationsResults';

export type ChatForwardModalProps = {
  onClose: () => void;
  selectedMessage: ChatMessageIMessage | undefined;
};

/// Limit to forward maximum number of contacts
export const maxConnectionsForward = 3;

export const ChatForwardModal = memo(
  forwardRef((props: ChatForwardModalProps, ref: React.Ref<BottomSheetModalMethods>) => {
    const { onClose, selectedMessage: message } = props;
    const { isDarkMode } = useDarkMode();
    const { data: connections } = useAllConnections(true);
    const { data: allConversations } = useConversationsWithRecentMessage().all;
    const { mutateAsync: createConversation } = useConversation().create;
    const { mutate: sendMessage, error } = useChatMessage().send;
    const [selectedContact, setselectedContact] = useState<DotYouProfile[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<
      HomebaseFile<UnifiedConversation>[]
    >([]);
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const { bottom } = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(false);
    const { add } = useErrors();
    const [query, setQuery] = useState<string | undefined>(undefined);

    const getAudio = useAudio().fetchManually;
    const { getFromCache } = useImage();
    const { fetchManually: getVideoData } = useVideo({
      fileId: message?.fileId,
      targetDrive: ChatDrive,
    });

    const onDismiss = useCallback(() => {
      if (selectedContact.length > 0) {
        setselectedContact([]);
      }
      if (selectedConversation.length > 0) {
        setSelectedConversation([]);
      }
      onClose();
    }, [onClose, selectedContact.length, selectedConversation.length]);

    const onForward = useCallback(async () => {
      if ((selectedContact.length === 0 && selectedConversation.length === 0) || !message) return;
      setIsLoading(true);
      async function forwardMessages(
        conversation: HomebaseFile<UnifiedConversation>,
        message: ChatMessageIMessage
      ) {
        const messagePayloads: ImageSource[] = [];
        if (message.fileMetadata.payloads && message.fileMetadata.payloads.length > 0) {
          const payloads = message.fileMetadata.payloads;

          for (const payload of payloads) {
            if (payload.contentType.startsWith('image')) {
              const image = getFromCache(undefined, message.fileId, payload.key, ChatDrive);
              let imageSize: {
                width: number;
                height: number;
              } = {
                width: payload.previewThumbnail?.pixelWidth || 0,
                height: payload.previewThumbnail?.pixelHeight || 0,
              };

              if (image?.imageData) {
                // If the image size is undefined, fetch the image size
                if (imageSize.width === 0 || imageSize.height === 0) {
                  imageSize = await getImageSize(image.imageData.url);
                }
                messagePayloads.push({
                  uri: image.imageData.url,
                  width: imageSize.width,
                  height: imageSize.height,
                  type: image.imageData?.type,
                } as ImageSource);
              }
            }
            if (
              payload.contentType.startsWith('video')

              //TODO Add support HLS video || payload.contentType === 'application/vnd.apple.mpegurl'
            ) {
              const downloadPayload = await getVideoData(payload.key);
              if (downloadPayload) {
                messagePayloads.push({
                  uri: downloadPayload.uri,
                  width: message.fileMetadata.appData.previewThumbnail?.pixelWidth || 1920,
                  height: message.fileMetadata.appData.previewThumbnail?.pixelHeight || 1080,
                  type: downloadPayload.type,
                } as ImageSource);
              }
            }
            if (payload.contentType.startsWith('audio')) {
              const audio = await getAudio(message.fileId, payload.key, ChatDrive);
              if (audio) {
                messagePayloads.push({
                  uri: audio.url,
                  type: audio.type,
                } as ImageSource);
              }
            }
          }
        }

        if (!message.fileMetadata.appData.content.message && messagePayloads.length === 0) {
          add(
            new Error(
              "[500]: Looks like the payload data isn't present in the cache or hasn't been downloaded."
            ),
            "Can't forward message",
            'No message or media to forward'
          );
          return;
        }
        return sendMessage({
          conversation,
          message: message.fileMetadata.appData.content.message,
          files: messagePayloads,
          chatId: getNewId(),
          userDate: new Date().getTime(),
        });
      }

      const promises: Promise<void>[] = [];
      if (selectedContact.length > 0) {
        promises.push(
          ...selectedContact.flatMap(async (contact) => {
            const newConversation = await createConversation({
              recipients: [contact.odinId],
            });

            return forwardMessages(newConversation, message);
          })
        );
      }

      if (selectedConversation.length > 0) {
        promises.push(
          ...selectedConversation.flatMap((group) => {
            return forwardMessages(group, message);
          })
        );
      }

      await Promise.all(promises);
      if (promises.length === 1) {
        if (selectedContact.length === 1) {
          const contact = selectedContact[0];

          const newConversation = await createConversation({
            recipients: [contact.odinId],
          });
          navigation.navigate('ChatScreen', {
            convoId: newConversation.fileMetadata.appData.uniqueId as string,
          });
        }
        if (selectedConversation.length === 1) {
          const group = selectedConversation[0];
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
      onDismiss();
    }, [
      add,
      createConversation,
      getAudio,
      getFromCache,
      getVideoData,
      message,
      navigation,
      onDismiss,
      selectedContact,
      selectedConversation,
      sendMessage,
    ]);

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter
          {...props}
          style={{
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingBottom: bottom,
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
            onPress={onForward}
            disabled={isLoading}
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
              <Text style={styles.footerText}>{!isLoading ? 'Send' : 'Sending'}</Text>
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <View
                  style={{
                    transform: [{ rotate: '50deg' }],
                  }}
                >
                  <SendChat color={Colors.white} />
                </View>
              )}
            </View>
          </TouchableHighlight>
        </BottomSheetFooter>
      ),
      [bottom, isDarkMode, isLoading, onForward, selectedContact, selectedConversation]
    );
    const isQueryActive = useMemo(() => !!(query && query.length >= 1), [query]);
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['69%', '93%']}
        onDismiss={onDismiss}
        enableDismissOnClose={true}
        backdropComponent={Backdrop}
        enablePanDownToClose
        index={0}
        keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
        keyboardBlurBehavior={'restore'}
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
        footerComponent={
          selectedContact.length > 0 || selectedConversation.length > 0 ? renderFooter : undefined
        }
      >
        <ErrorNotification error={error} />
        <Text style={styles.headerText}>Forward To</Text>
        <BottomSheetTextInput
          placeholder="Search..."
          style={{
            backgroundColor: isDarkMode ? `${Colors.indigo[700]}3A` : `${Colors.indigo[300]}3C`,
            borderRadius: 20,
            paddingVertical: Platform.OS === 'ios' ? 16 : undefined,
            marginHorizontal: 12,
            marginVertical: 12,
            paddingLeft: 12,
            fontSize: 16,
            color: isDarkMode ? Colors.white : Colors.black,
          }}
          onChangeText={setQuery}
        />
        {isQueryActive ? (
          <SearchConversationWithSelectionResults
            query={query}
            allConversations={allConversations || []}
            selectedContact={selectedContact}
            setSelectedContact={setselectedContact}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
          />
        ) : (
          <InnerForwardListPage
            connections={connections}
            allConversations={allConversations}
            selectedContact={selectedContact}
            setSelectedContact={setselectedContact}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
          />
        )}
      </BottomSheetModal>
    );
  })
);
const InnerForwardListPage = memo(
  (props: {
    connections: DotYouProfile[] | undefined;
    allConversations: ConversationWithRecentMessage[] | undefined;
    selectedContact: DotYouProfile[];
    setSelectedContact: React.Dispatch<React.SetStateAction<DotYouProfile[]>>;
    selectedConversation: HomebaseFile<UnifiedConversation>[];
    setSelectedConversation: React.Dispatch<
      React.SetStateAction<HomebaseFile<UnifiedConversation>[]>
    >;
  }) => {
    const {
      connections,
      allConversations,
      selectedContact,
      setSelectedContact,
      selectedConversation,
      setSelectedConversation,
    } = props;

    const onSelectConversation = useCallback(
      (conversation: HomebaseFile<UnifiedConversation>) => {
        setSelectedConversation((selectedConversation) => {
          if (selectedConversation.includes(conversation)) {
            return selectedConversation.filter((c) => c !== conversation);
          } else {
            if (selectedContact.length + selectedConversation.length === maxConnectionsForward) {
              Toast.show({
                type: 'info',
                text1: t('Forward limit reached'),
                text2: t('You can only forward to {0} contacts at a time', maxConnectionsForward),
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
                text1: t('Forward limit reached'),
                text2: t('You can only forward to {0} contacts at a time', maxConnectionsForward),
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
      return [
        {
          id: 'recent',
          title: t('Recents'),
          data: allConversations?.slice(0, 5) || [], // Show top 5 recent conversations
          keyExtractor: (item) => (item as ConversationWithRecentMessage).fileId,
        },
        {
          id: 'contacts',
          title: t('Contacts'),
          data: connections || [],
          keyExtractor: (item) => (item as DotYouProfile).odinId,
        },
      ];
    }, [connections, allConversations]);

    const renderSectionHeader = useCallback(
      ({
        section: { title, data },
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
        if (data?.length === 0) {
          return null;
        }
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
              conversationUpdated={conversation.fileMetadata.updated}
              onPress={() => onSelectConversation(conversation)}
              odinId={conversation.fileMetadata.appData.content.recipients[0]}
              fileId={conversation.fileId}
              previewThumbnail={conversation.fileMetadata.appData.previewThumbnail}
              payloadKey={conversation.fileMetadata.payloads?.[0]?.key}
              style={{ padding: 0, paddingHorizontal: 16, paddingVertical: 10 }}
            />
          );
        }

        if (section.id === 'contacts') {
          const contact = item as unknown as DotYouProfile;
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

    // No need to render yet, the data is still loading and is offline available
    if (!connections || !allConversations) {
      return null;
    }
    return (
      <BottomSheetSectionList
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
          <GroupConversationsComponent
            selectedGroup={selectedConversation}
            setselectedGroup={setSelectedConversation}
          />
        }
        ListFooterComponentStyle={{
          paddingBottom: 100,
        }}
      />
    );
  }
);

export const GroupConversationsComponent = memo(
  ({
    selectedGroup,
    setselectedGroup,
  }: {
    selectedGroup: HomebaseFile<UnifiedConversation>[];
    setselectedGroup: (group: HomebaseFile<UnifiedConversation>[]) => void;
  }) => {
    const { data: conversations } = useConversations().all;
    const flatConversations = useMemo(
      () =>
        (
          conversations?.pages
            .flatMap((page) => page?.searchResults)
            .filter(
              (convo) =>
                convo &&
                [0, undefined].includes(convo.fileMetadata.appData.archivalStatus) &&
                convo.fileMetadata.appData.content.recipients.length > 2
            ) as HomebaseFile<UnifiedConversation>[]
        )?.sort((a, b) =>
          a?.fileMetadata.appData.content.title.localeCompare(b?.fileMetadata.appData.content.title)
        ) || [],
      [conversations]
    );

    const onSelect = useCallback(
      (group: HomebaseFile<UnifiedConversation>) => {
        if (selectedGroup.includes(group)) {
          setselectedGroup(selectedGroup.filter((grp) => grp !== group));
        } else {
          setselectedGroup([...selectedGroup, group]);
        }
      },
      [selectedGroup, setselectedGroup]
    );
    if (!flatConversations || flatConversations.length === 0) {
      return null;
    }

    return (
      <View
        style={{
          flexDirection: 'column',
          flex: 1,
        }}
      >
        <Text
          style={{
            ...styles.headerText,
            textAlign: 'left',
            fontSize: 18,
            marginLeft: 16,
          }}
        >
          Groups
        </Text>
        {flatConversations.map((convo) => (
          <GroupConversationTile
            key={convo.fileId}
            fileId={convo.fileId}
            previewThumbnail={convo.fileMetadata.appData.previewThumbnail}
            fileKey={convo.fileMetadata.payloads?.[0]?.key}
            conversation={convo.fileMetadata.appData.content}
            onPress={() => onSelect(convo)}
            isSelected={selectedGroup.includes(convo)}
            selectMode
          />
        ))}
      </View>
    );
  }
);

const GroupConversationTile = memo(
  ({
    selectMode,
    isSelected,
    conversation,
    onPress,
    fileId,
    fileKey,
    previewThumbnail,
  }: {
    selectMode?: boolean;
    isSelected?: boolean;
    onPress?: () => void;
    conversation: UnifiedConversation;
    fileId?: string;
    fileKey?: string;
    previewThumbnail?: EmbeddedThumb;
  }) => {
    const { isDarkMode } = useDarkMode();
    return (
      <TouchableOpacity onPress={onPress}>
        <View
          style={{
            flexDirection: 'row',
            borderRadius: 5,
            paddingHorizontal: 16,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <View style={{ marginRight: 16 }}>
            <GroupAvatar
              fileId={fileId}
              fileKey={fileKey}
              previewThumbnail={previewThumbnail}
              targetDrive={ChatDrive}
            />
          </View>

          <View style={styles.content}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 18,
                fontWeight: '400',
                color: isDarkMode ? Colors.white : Colors.slate[900],
              }}
            >
              {conversation.title}
            </Text>
          </View>
          {selectMode && isSelected ? <CheckCircle size={'lg'} /> : <CircleOutlined size={'lg'} />}
        </View>
      </TouchableOpacity>
    );
  }
);

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
