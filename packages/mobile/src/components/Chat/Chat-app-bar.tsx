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
import { Copy, Forward, Info, Pencil, Reply, Trash } from '../ui/Icons/icons';
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

export const ChatAppBar = memo(
  ({
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

    const defaultActions = useCallback(() => {
      Toast.show({
        type: 'info',
        text1: 'No action provided',
        text2: 'Make sure u are passing the props correctly',
      });
    }, []);

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
          <IconButton
            icon={<Reply />}
            onPress={selectedMessageActions?.onReply || defaultActions}
          />
          <IconButton icon={<Info />} onPress={selectedMessageActions?.onInfo || defaultActions} />
          <IconButton icon={<Copy />} onPress={selectedMessageActions?.onCopy || defaultActions} />
          {selectedMessage.fileMetadata.senderOdinId === '' && (
            <>
              <IconButton
                icon={<Pencil />}
                onPress={selectedMessageActions?.onEdit || defaultActions}
              />
              <IconButton
                icon={<Trash />}
                onPress={selectedMessageActions?.onDelete || defaultActions}
              />
            </>
          )}
          <IconButton
            icon={<Forward />}
            onPress={selectedMessageActions?.onForward || defaultActions}
          />
        </View>
      );
    }, [
      defaultActions,
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
          title={
            selectedMessage ? '' : !isSelf ? title : `${user?.firstName} ${user?.surName} (you)`
          }
          headerTitleAlign="left"
          headerLeft={headerLeft}
          headerRight={headerRight}
          headerStyle={headerStyle}
          headerShadowVisible={false}
        />
      </Pressable>
    );
  }
);
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
    onPress: () => void;
    touchableProps?: Omit<TouchableOpacityProps, 'onPress'>;
  }) => {
    return (
      <TouchableOpacity onPress={onPress} style={{ padding: 10 }} {...touchableProps}>
        {icon}
      </TouchableOpacity>
    );
  }
);
