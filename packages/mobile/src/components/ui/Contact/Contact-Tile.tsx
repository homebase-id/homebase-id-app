import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useConversation } from '../../../hooks/chat/useConversation';
import { OdinImage } from '../OdinImage/OdinImage';
import { ContactConfig, ContactFile } from '@youfoundation/js-lib/network';
import { CheckCircle, ChevronRight, CircleOutlined } from '../Icons/Icons';
import { useDarkMode } from 'chat-app-common';
import { Colors } from '../../../app/Colors';

export const ContactTile = ({
  item: dsrContact,
  onOpen,
  onPress,
  isSelected,
  selectMode,
}: {
  item: DriveSearchResult<ContactFile>;
  onOpen?: (conversationId: string) => void;
  onPress?: () => void;
  isSelected?: boolean;
  selectMode?: boolean;
}) => {
  const contact = dsrContact.fileMetadata.appData.content as ContactFile;
  const odinId = contact.odinId;
  const { isDarkMode } = useDarkMode();

  const { mutateAsync: createNew } = useConversation().create;
  const onClick = async () => {
    if (!odinId) return;
    try {
      const results = await createNew({
        recipients: [odinId],
        title: contact.name?.displayName,
      });
      if (onOpen) onOpen(results.newConversationId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <TouchableOpacity onPress={selectMode ? onPress : onClick}>
      <View
        style={[
          styles.tile,
          {
            backgroundColor: isDarkMode ? Colors.slate[900] : Colors.white,
          },
        ]}>
        <OdinImage
          targetDrive={ContactConfig.ContactTargetDrive}
          fit="contain"
          alt={contact.name?.displayName}
          fileId={dsrContact.fileId}
          fileKey={'prfl_pic'}
          style={styles.tinyLogo}
        />
        <View style={[styles.content]}>
          <Text
            style={[
              styles.title,
              {
                color: isDarkMode ? Colors.white : Colors.black,
              },
            ]}>
            {contact.name?.displayName ??
              contact.name?.givenName ??
              contact.name?.additionalName}
          </Text>
          <Text
            style={[
              styles.description,
              {
                color: isDarkMode ? Colors.white : Colors.black,
              },
            ]}>
            {contact.odinId}
          </Text>
        </View>
        {selectMode && (
          <View
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}>
            {isSelected ? (
              <CheckCircle size={'lg'} />
            ) : (
              <CircleOutlined size={'lg'} />
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const Tile = ({
  title,
  icon,
  onClick,
}: {
  title: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) => {
  const { isDarkMode } = useDarkMode();
  return (
    <TouchableOpacity onPress={onClick}>
      <View
        style={[
          styles.tile,
          {
            marginVertical: 0,
            marginTop: 2,
            backgroundColor: isDarkMode ? Colors.slate[800] : Colors.white,
          },
        ]}>
        <View
          style={{
            marginRight: 16,
          }}>
          {icon}
        </View>
        <View
          style={{
            flexDirection: 'row',
            display: 'flex',
            justifyContent: 'space-between',
            flexGrow: 1,
          }}>
          <Text
            style={[
              styles.title1,
              {
                color: isDarkMode ? Colors.white : Colors.black,
              },
            ]}>
            {title}
          </Text>
          <ChevronRight size={'lg'} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.white,
    paddingLeft: 10,
    paddingVertical: 10,
    margin: 6,
    marginBottom: 0,
    flexDirection: 'row',
    borderRadius: 5,
  },
  content: {
    borderRadius: 8,
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  title1: {
    fontSize: 18,
    fontWeight: '400',
  },
  tinyLogo: {
    objectFit: 'cover',
    marginLeft: 0,
    marginRight: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  description: {
    fontSize: 16,
    marginVertical: 4,
  },
});
