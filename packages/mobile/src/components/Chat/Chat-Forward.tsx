import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetModal,
  TouchableHighlight,
} from '@gorhom/bottom-sheet';
import { forwardRef, memo, useCallback, useState } from 'react';
import { Text } from '../ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useAllConnections } from 'feed-app-common';
import {
  ActivityIndicator,
  ListRenderItemInfo,
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
import { ChatDrive, UnifiedConversation } from '../../provider/chat/ConversationProvider';
import { useConversations } from '../../hooks/chat/useConversations';
import { EmbeddedThumb, HomebaseFile } from '@homebase-id/js-lib/core';
import { GroupAvatar } from '../ui/Avatars/Avatar';
import { getNewId } from '@homebase-id/js-lib/helpers';
import { useAuth } from '../../hooks/auth/useAuth';
import { useAudio } from '../ui/OdinAudio/hooks/useAudio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideo } from '../../hooks/video/useVideo';
import { ImageSource } from '../../provider/image/RNImageProvider';

export type ChatForwardModalProps = {
  onClose: () => void;
  selectedMessage: ChatMessageIMessage | undefined;
};

/// Limit to forward maximum number of contacts
export const maxConnectionsForward = 3;

export const ChatForwardModal = forwardRef(
  (props: ChatForwardModalProps, ref: React.Ref<BottomSheetModalMethods>) => {
    const { onClose, selectedMessage: message } = props;
    const { isDarkMode } = useDarkMode();
    const { data: connections } = useAllConnections(true);
    const { mutateAsync: createConversation } = useConversation().create;
    const { mutate: sendMessage, error } = useChatMessage().send;
    const [selectedContact, setselectedContact] = useState<DotYouProfile[]>([]);
    const [selectedGroup, setselectedGroup] = useState<HomebaseFile<UnifiedConversation>[]>([]);
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const { authToken } = useAuth();
    const { bottom } = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(false);

    const getAudio = useAudio().getFromCache;
    const { getFromCache } = useImage();
    const { getFromCache: getVideoData } = useVideo({
      fileId: message?.fileId,
      targetDrive: ChatDrive,
    });

    const onDismiss = useCallback(() => {
      if (selectedContact.length > 0) {
        setselectedContact([]);
      }
      if (selectedGroup.length > 0) {
        setselectedGroup([]);
      }
      onClose();
    }, [onClose, selectedContact.length, selectedGroup.length]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} opacity={0.5} appearsOnIndex={0} disappearsOnIndex={-1} />
      ),
      []
    );

    const onForward = useCallback(async () => {
      if ((selectedContact.length === 0 && selectedGroup.length === 0) || !message) return;

      async function forwardMessages(
        conversation: HomebaseFile<UnifiedConversation>,
        message: ChatMessageIMessage
      ) {
        setIsLoading(true);
        let imageSource: ImageSource[] = [];
        if (message.fileMetadata.payloads.length > 0) {
          const payloads = message.fileMetadata.payloads;
          imageSource = (
            await Promise.all(
              payloads.map(async (payload) => {
                if (payload.contentType.startsWith('image')) {
                  const image = getFromCache(undefined, message.fileId, payload.key, ChatDrive);
                  if (!image?.imageData) return;
                  return {
                    uri: image.imageData.url,
                    width: image.imageData?.naturalSize?.pixelWidth,
                    height: image.imageData?.naturalSize?.pixelHeight,
                    type: image.imageData?.type,
                  } as ImageSource;
                }
                if (payload.contentType.startsWith('video')) {
                  if (!authToken) return;
                  const downloadPayload = await getVideoData(payload.key);
                  if (!downloadPayload) return;
                  return {
                    uri: downloadPayload.url,
                    width: message.fileMetadata.appData.previewThumbnail?.pixelWidth || 1920,
                    height: message.fileMetadata.appData.previewThumbnail?.pixelHeight || 1080,
                    type: downloadPayload.type,
                  } as ImageSource;
                }
                if (payload.contentType.startsWith('audio')) {
                  const audio = getAudio(message.fileId, payload.key, ChatDrive);
                  if (!audio) return;
                  return {
                    uri: audio.url,
                    type: audio.type,
                  } as ImageSource;
                }
                return;
              })
            )
          ).filter(Boolean) as ImageSource[];
        }
        setIsLoading(false);
        return sendMessage({
          conversation,
          message: message.fileMetadata.appData.content.message,
          files: imageSource,
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

      if (selectedGroup.length > 0) {
        promises.push(
          ...selectedGroup.flatMap((group) => {
            return forwardMessages(group, message);
          })
        );
      }

      await Promise.all(promises);
      if (promises.length === 1) {
        if (selectedContact.length === 1) {
          const contact = selectedContact[0];

          // TODO: needs to change to fetch instead of still trying to create
          const newConversation = await createConversation({
            recipients: [contact.odinId],
          });
          navigation.navigate('ChatScreen', {
            convoId: newConversation.fileMetadata.appData.uniqueId as string,
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
      onDismiss();
    }, [
      authToken,
      createConversation,
      getAudio,
      getFromCache,
      getVideoData,
      message,
      navigation,
      onDismiss,
      selectedContact,
      selectedGroup,
      sendMessage,
    ]);

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
                    type: 'info',
                    text1: 'Forward limit reached',
                    text2: `You can only forward to ${maxConnectionsForward} contacts at a time`,
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
      [bottom, isDarkMode, isLoading, onForward, selectedContact, selectedGroup]
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['69%', '93%']}
        onDismiss={onDismiss}
        enableDismissOnClose={true}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        index={0}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
        footerComponent={
          selectedContact.length > 0 || selectedGroup.length > 0 ? renderFooter : undefined
        }
      >
        <ErrorNotification error={error} />
        <Text style={styles.headerText}>Forward To</Text>
        <BottomSheetFlatList
          data={connections}
          keyExtractor={(item) => item.odinId}
          ListHeaderComponent={
            <ListHeaderComponent
              selectedGroup={selectedGroup}
              setselectedGroup={setselectedGroup}
            />
          }
          renderItem={renderItem}
        />
      </BottomSheetModal>
    );
  }
);

export const ListHeaderComponent = memo(
  ({
    selectedGroup,
    setselectedGroup,
  }: {
    selectedGroup: HomebaseFile<UnifiedConversation>[];
    setselectedGroup: (group: HomebaseFile<UnifiedConversation>[]) => void;
  }) => {
    const { data: conversations } = useConversations().all;
    const flatConversations =
      (conversations?.pages
        .flatMap((page) => page?.searchResults)
        .filter(
          (convo) =>
            convo &&
            [0, undefined].includes(convo.fileMetadata.appData.archivalStatus) &&
            convo.fileMetadata.appData.content.recipients.length > 2
        ) as HomebaseFile<UnifiedConversation>[]) || [];

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
