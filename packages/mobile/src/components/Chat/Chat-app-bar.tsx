import {
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { useProfile } from '../../hooks/profile/useProfile';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatMessageIMessage } from './ChatDetail';
import { memo, ReactNode, useCallback, useMemo } from 'react';
import { Copy, EllipsisVertical, Forward, Info, Pencil, Reply, Trash } from '../ui/Icons/icons';
import Toast from 'react-native-toast-message';
import { Avatar, GroupAvatar, OwnerAvatar } from '../ui/Avatars/Avatar';

export type SelectedMessageProp = {
  onReply: () => void;
  onInfo: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onForward: () => void;
  onEdit: () => void;
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
  onMorePress,
}: {
  odinId: string;
  group?: boolean;
  title: string;
  goBack: () => void;
  isSelf?: boolean;
  onPress: () => void;
  onMorePress: () => void;
  selectedMessage?: ChatMessageIMessage;
  selectedMessageActions?: SelectedMessageProp;
}) => {
  const user = useProfile().data;
  const { isDarkMode } = useDarkMode();

  const headerStyle = useMemo(
    () => ({
      backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
    }),
    [isDarkMode]
  );
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

  const headerRight = useCallback(() => {
    if (!selectedMessage) {
      return (
        <TouchableOpacity
          hitSlop={{
            right: 10,
            left: 10,
            bottom: 4,
          }}
          onPress={onMorePress}
        >
          <EllipsisVertical />
        </TouchableOpacity>
      );
    }
    const isVideoMessage = selectedMessage.fileMetadata.payloads.some((payload) =>
      payload?.contentType?.startsWith('video')
    );
    return (
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <IconButton icon={<Reply />} onPress={selectedMessageActions?.onReply} />
        <IconButton icon={<Info />} onPress={selectedMessageActions?.onInfo} />
        <IconButton icon={<Copy />} onPress={selectedMessageActions?.onCopy} />
        {selectedMessage.fileMetadata.senderOdinId === '' && (
          <IconButton icon={<Pencil />} onPress={selectedMessageActions?.onEdit} />
        )}
        <IconButton icon={<Trash />} onPress={selectedMessageActions?.onDelete} />
        {!isVideoMessage && (
          <IconButton icon={<Forward />} onPress={selectedMessageActions?.onForward} />
        )}
      </View>
    );
  }, [
    onMorePress,
    selectedMessage,
    selectedMessageActions?.onCopy,
    selectedMessageActions?.onDelete,
    selectedMessageActions?.onEdit,
    selectedMessageActions?.onForward,
    selectedMessageActions?.onInfo,
    selectedMessageActions?.onReply,
  ]);
  return (
    <Pressable onPress={onPress}>
      <Header
        title={selectedMessage ? '' : !isSelf ? title : `${user?.firstName} ${user?.surName} (you)`}
        headerTitleAlign="left"
        headerLeft={headerLeft}
        headerRight={headerRight}
        headerStyle={headerStyle}
        headerShadowVisible={false}
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

export const IconButton = memo(
  ({
    icon,
    onPress,
    touchableProps,
  }: {
    icon: ReactNode;
    onPress?: () => void;
    touchableProps?: Omit<TouchableOpacityProps, 'onPress'>;
  }) => {
    const defaultActions = useCallback(() => {
      Toast.show({
        type: 'info',
        text1: 'No action provided',
        text2: 'Make sure u are passing the props correctly',
      });
    }, []);
    return (
      <TouchableOpacity
        onPress={onPress || defaultActions}
        style={{ padding: 10 }}
        {...touchableProps}
      >
        {icon}
      </TouchableOpacity>
    );
  }
);
