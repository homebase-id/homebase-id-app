import { Platform, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { useProfile } from '../../hooks/profile/useProfile';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ChatMessageIMessage } from './ChatDetail';
import { useCallback, useMemo } from 'react';
import { Copy, EllipsisVertical, Forward, Info, Pencil, Reply, Trash } from '../ui/Icons/icons';
import { Avatar, GroupAvatar, OwnerAvatar } from '../ui/Avatars/Avatar';
import { EmbeddedThumb } from '@homebase-id/js-lib/core';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { IconButton } from '../ui/Buttons';
import { useDotYouClientContext } from 'feed-app-common';

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
  groupAvatarProp,
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
  groupAvatarProp?:
    | {
        fileId: string;
        fileKey: string;
        previewThumbnail?: EmbeddedThumb;
      }
    | undefined;
}) => {
  const user = useProfile().data;
  const identity = useDotYouClientContext().getIdentity();
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
          <GroupAvatar
            fileId={groupAvatarProp?.fileId}
            targetDrive={ChatDrive}
            previewThumbnail={groupAvatarProp?.previewThumbnail}
            fileKey={groupAvatarProp?.fileKey}
            style={styles.avatar}
          />
        )}
      </View>
    ),
    [
      goBack,
      group,
      groupAvatarProp?.fileId,
      groupAvatarProp?.fileKey,
      groupAvatarProp?.previewThumbnail,
      isDarkMode,
      isSelf,
      odinId,
      selectedMessage,
    ]
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

    const isMyMessage =
      selectedMessage.fileMetadata.senderOdinId === identity ||
      !selectedMessage.fileMetadata.senderOdinId;

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
        {isMyMessage && <IconButton icon={<Pencil />} onPress={selectedMessageActions?.onEdit} />}
        <IconButton icon={<Trash />} onPress={selectedMessageActions?.onDelete} />
        <IconButton icon={<Forward />} onPress={selectedMessageActions?.onForward} />
      </View>
    );
  }, [
    identity,
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
