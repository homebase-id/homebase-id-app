import { Platform, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, GroupAvatar, OwnerAvatar } from './Conversation-tile';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { useProfile } from '../../hooks/profile/useProfile';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatMessageIMessage } from './ChatDetail';
import { ReactNode, useCallback } from 'react';
import { Copy, Info, Reply, Trash } from '../ui/Icons/icons';
import Toast from 'react-native-toast-message';

export type SelectedMessageProp = {
  onReply: () => void;
  onInfo: () => void;
  onCopy: () => void;
  onDelete: () => void;
};

export const ChatAppBar = ({
  odinId,
  group = false,
  title,
  goBack,
  isSelf,
  onPress,
  selectedMessage,
  selectedMessageActions,
}: {
  odinId: string;
  group?: boolean;
  title: string;
  goBack: () => void;
  isSelf?: boolean;
  onPress: () => void;
  selectedMessage?: ChatMessageIMessage;
  selectedMessageActions?: SelectedMessageProp;
}) => {
  const user = useProfile().data;
  const { isDarkMode } = useDarkMode();
  const headerLeft = useCallback(
    () => (
      <View
        style={{
          flexDirection: 'row',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <HeaderBackButton
          style={{ marginRight: Platform.OS === 'ios' ? -10 : 0 }}
          canGoBack={true}
          onPress={goBack}
          labelVisible={false}
          tintColor={isDarkMode ? Colors.white : Colors.black}
        />
        {selectedMessage ? null : !group ? (
          isSelf ? (
            <OwnerAvatar style={styles.avatar} imageSize={{ width: 36, height: 36 }} />
          ) : (
            <Avatar odinId={odinId} style={styles.avatar} imageSize={{ width: 36, height: 36 }} />
          )
        ) : (
          <GroupAvatar style={styles.avatar} />
        )}
      </View>
    ),
    [goBack, group, isDarkMode, isSelf, odinId, selectedMessage]
  );

  const defaultActions = () => {
    Toast.show({
      type: 'info',
      text1: 'No action provided',
      text2: 'Make sure u are passing the props correctly',
    });
  };

  const headerRight = useCallback(() => {
    if (!selectedMessage) {
      return null;
    }
    return (
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <IconButton icon={<Reply />} onPress={selectedMessageActions?.onReply || defaultActions} />
        <IconButton icon={<Info />} onPress={selectedMessageActions?.onInfo || defaultActions} />
        <IconButton icon={<Copy />} onPress={selectedMessageActions?.onCopy || defaultActions} />
        {selectedMessage.fileMetadata.senderOdinId === '' && (
          <IconButton
            icon={<Trash />}
            onPress={selectedMessageActions?.onDelete || defaultActions}
          />
        )}
      </View>
    );
  }, [selectedMessage, selectedMessageActions]);
  return (
    <Pressable onPress={onPress}>
      <Header
        title={selectedMessage ? '' : !isSelf ? title : `${user?.firstName} ${user?.surName} (you)`}
        headerTitleAlign="left"
        headerLeft={headerLeft}
        headerRight={headerRight}
      />
    </Pressable>
  );
};
const styles = StyleSheet.create({
  titleStyle: {
    fontSize: 18,
    fontWeight: '500',
  },
  avatar: {
    width: 36,
    height: 36,
    marginRight: 0,
    borderRadius: 18,
  },
});

const IconButton = ({ icon, onPress }: { icon: ReactNode; onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 10 }}>
      {icon}
    </TouchableOpacity>
  );
};
