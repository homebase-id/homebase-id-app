import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useConversation } from '../../hooks/chat/useConversation';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Input } from '../../components/ui/Form/Input';
import TextButton from '../../components/ui/Text/Text-Button';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { ChatStackParamList } from '../../app/ChatStack';
import { Avatar, GroupAvatar, OwnerAvatar } from '../../components/ui/Avatars/Avatar';

import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';
import { t, useAllConnections } from 'homebase-id-app-common';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { useAuth } from '../../hooks/auth/useAuth';
import { useIntroductions } from '../../hooks/introductions/useIntroductions';
import { Text } from '../../components/ui/Text/Text';
import { ConnectionName } from '../../components/ui/Name';
import { BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { Backdrop } from '../../components/ui/Modal/Backdrop';
import { CheckCircle, CircleOutlined, XIcon } from '../../components/ui/Icons/icons';
import { SearchConversationWithSelectionResults } from '../../components/Chat/SearchConversationsResults';
import { FlatList } from 'react-native-gesture-handler';
import { ContactTile } from '../../components/Contact/Contact-Tile';
import { IconButton } from '../../components/ui/Buttons';
import { useTextInput } from '../../hooks/useTextInput';

export type EditGroupProp = NativeStackScreenProps<ChatStackParamList, 'EditGroup'>;

export function EditGroupPage(props: EditGroupProp) {
  const { convoId: conversationId } = props.route.params;
  const {
    single: { data: conversation },
    update: { mutate: updateGroupConversation, status: updateStatus },
  } = useConversation({ conversationId });

  const conversationContent = conversation?.fileMetadata.appData.content;
  const [title, setTitle] = useState<string>(conversationContent?.title || '');
  // const [, setAsset] = useState<ImageSource | undefined>();
  const identity = useAuth().getIdentity();
  const { mutate: introduceIdentities } = useIntroductions().introduceIdentities;

  const [newRecipients, setNewRecipients] = useState<string[]>([]);
  const onRemove = useCallback(
    (odinId: string) =>
      setNewRecipients((currentRecipients) => currentRecipients.filter((x) => x !== odinId)),
    []
  );

  const setContact = useCallback((newContact: string) => {
    setNewRecipients((currentRecipients) => [...currentRecipients, newContact]);
  }, []);

  const recipients = conversationContent?.recipients.filter((recipient) => recipient !== identity);

  const save = useCallback(() => {
    if (!conversation) return;
    const newConversation = { ...conversation };

    if (title !== conversationContent?.title) {
      newConversation.fileMetadata.appData.content.title = title;
    }

    if (newRecipients.length) {
      newConversation.fileMetadata.appData.content.recipients = [
        ...newConversation.fileMetadata.appData.content.recipients,
        ...newRecipients,
      ];

      introduceIdentities({
        recipients: newRecipients,
        message: t('{0} has added you to a group chat', identity || ''),
      });
    }

    updateGroupConversation({ conversation: newConversation, distribute: true });
  }, [
    conversation,
    conversationContent,
    identity,
    introduceIdentities,
    newRecipients,
    title,
    updateGroupConversation,
  ]);

  // const pickAvatar = useCallback(async () => {
  //   const image = await launchImageLibrary({
  //     mediaType: 'photo',
  //     selectionLimit: 1,
  //   });
  //   if (image.assets) {
  //     const pickedImage = image.assets[0];
  //     const imageSource: ImageSource = {
  //       uri: pickedImage.uri,
  //       type: pickedImage.type,
  //       height: pickedImage.height || 0,
  //       width: pickedImage.width || 0,
  //       filename: pickedImage.fileName || '',
  //       fileSize: pickedImage.fileSize,
  //     };
  //     setAsset(imageSource);
  //   }
  // }, []);

  useEffect(() => {
    if (updateStatus === 'success') {
      props.navigation.goBack();
    }
  }, [props.navigation, updateStatus]);

  const headerLeft = useCallback(
    () => <HeaderBackButton onPress={props.navigation.goBack} />,
    [props.navigation.goBack]
  );

  const headerRight = useCallback(() => {
    const shouldShowEdit =
      (title !== conversationContent?.title && title?.length > 0) || newRecipients.length > 0;
    if (shouldShowEdit) {
      return <TextButton title="Save" unFilledStyle={{ marginRight: 8 }} onPress={save} />;
    }
    if (updateStatus === 'pending') {
      return <ActivityIndicator size={'small'} style={{ marginRight: 8 }} />;
    }
    return undefined;
  }, [conversationContent?.title, newRecipients.length, save, title, updateStatus]);

  const { isDarkMode } = useDarkMode();

  const headerColor = useMemo(
    () => (isDarkMode ? Colors.slate[900] : Colors.gray[50]),
    [isDarkMode]
  );
  const [visible, setVisible] = useState(false);
  if (!conversation) return null;

  const hasGroupImage =
    conversation.fileMetadata.payloads && conversation.fileMetadata.payloads?.length > 0;
  const groupAvatarPayloadKey = conversation.fileMetadata.payloads?.[0]?.key;

  return (
    <View
      style={{
        backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        flex: 1,
      }}
    >
      <View
        style={[
          {
            paddingVertical: 3,
            width: '100%',
            zIndex: 10,
          },
        ]}
      >
        <Header
          title={t('Edit Group')}
          headerLeft={headerLeft}
          headerRight={headerRight}
          headerStyle={{
            backgroundColor: headerColor,
          }}
        />
      </View>

      <View style={styles.content}>
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
        {/* <TextButton title="Edit Avatar" onPress={pickAvatar} /> //TODO: When BE fixes appendPayload, this comes back :) */}
        <Input
          value={title}
          onChangeText={(title) => setTitle(title)}
          autoCorrect={false}
          autoFocus={true}
          autoCapitalize="sentences"
          style={{
            width: '70%',
          }}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: '500',
          }}
        >
          Recipients
        </Text>
        <TextButton title="Add Members" onPress={() => setVisible(true)} />
      </View>
      <ScrollView
        style={{
          flex: 1,
        }}
      >
        <RenderRecipientTile recipient={identity as string} isMe={true} />
        {recipients?.map((recipient) => (
          <RenderRecipientTile key={recipient} recipient={recipient} isMe={false} />
        ))}
        {newRecipients.map((recipient) => (
          <RenderRecipientTile
            key={recipient}
            recipient={recipient}
            isMe={false}
            newRecipient={newRecipients.includes(recipient)}
            onRemove={onRemove}
          />
        ))}
      </ScrollView>
      <ContactsBottomModal
        addContact={setContact}
        defaultValue={[...newRecipients, ...conversation.fileMetadata.appData.content.recipients]}
        visible={visible}
        onDismiss={() => setVisible(false)}
      />
    </View>
  );
}

const RenderRecipientTile = memo(
  ({
    recipient,
    isMe,
    selectMode,
    isSelected,
    onRemove,
    newRecipient,
  }: {
    recipient: string;
    isMe: boolean;
    selectMode?: boolean;
    isSelected?: boolean;
    onRemove?: (odinId: string) => void;
    newRecipient?: boolean;
  }) => {
    const { isDarkMode } = useDarkMode();
    return (
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          alignContent: 'center',
          padding: 8,
          marginTop: 8,
          backgroundColor: isDarkMode
            ? newRecipient
              ? Colors.gray[800]
              : undefined
            : newRecipient
              ? Colors.slate[200]
              : undefined,
          marginHorizontal: 12,
          borderRadius: newRecipient ? 8 : 0,
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
          style={{
            fontWeight: '400',
            fontSize: 18,
            marginLeft: 12,
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          <ConnectionName odinId={recipient as string} />
          {isMe && <Text style={styles.you}> (you) </Text>}
        </Text>
        {selectMode && (
          <View
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            {isSelected ? <CheckCircle size={'lg'} /> : <CircleOutlined size={'lg'} />}
          </View>
        )}
        {newRecipient && (
          <View
            style={{
              justifyContent: 'center',
              flex: 1,
            }}
          >
            <IconButton
              style={{
                alignSelf: 'flex-end',
              }}
              icon={<XIcon />}
              onPress={() => onRemove?.(recipient)}
            />
          </View>
        )}
      </View>
    );
  }
);

const ContactsBottomModal = memo(
  ({
    defaultValue,
    addContact,
    visible,
    onDismiss,
  }: {
    addContact: (newOdinId: string) => void;
    defaultValue: string[];
    visible?: boolean;
    onDismiss?: () => void;
  }) => {
    const ref = useRef<BottomSheetModal>(null);
    const { query, setQuery } = useTextInput();

    const { data: contacts } = useAllConnections(true);

    useLayoutEffect(() => {
      if (visible) {
        requestAnimationFrame(() => ref.current?.present());
      }
    }, [visible]);
    const { isDarkMode } = useDarkMode();
    const isQueryActive = useMemo(() => !!(query && query.length >= 1), [query]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['69%', '93%']}
        enableDismissOnClose={true}
        backdropComponent={Backdrop}
        enablePanDownToClose
        onDismiss={onDismiss}
        index={0}
        keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
        keyboardBlurBehavior={'restore'}
        android_keyboardInputMode="adjustResize"
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
        }}
        handleIndicatorStyle={{
          backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
        }}
      >
        <BottomSheetView
          style={{
            flex: 1,
          }}
        >
          <Text style={styles.headerText}>Contacts</Text>
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
              allConversations={[]}
              selectedContact={defaultValue.map((odinId) => ({ odinId }))}
              selectionLimit={Infinity}
              setSelectedContact={() => {}}
              onContactSelect={(odinId) => {
                if (!defaultValue.includes(odinId)) {
                  return addContact(odinId);
                }
              }}
            />
          ) : (
            <FlatList
              data={contacts?.filter((contact) => !defaultValue.includes(contact.odinId))}
              keyExtractor={(item) => item.odinId}
              renderItem={({ item }) => (
                <ContactTile
                  item={item}
                  selectMode
                  isSelected={defaultValue.includes(item.odinId)}
                  onPress={() => addContact(item.odinId)}
                />
              )}
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  avatar: {
    width: 81,
    height: 81,
    borderRadius: 50,
    margin: 16,
    marginRight: 0,
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
  headerText: {
    textAlign: 'center',
    margin: 6,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EditGroupPage;
