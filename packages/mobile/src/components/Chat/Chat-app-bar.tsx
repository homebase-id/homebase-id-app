import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Avatar, GroupAvatar, OwnerAvatar } from './Conversation-tile';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { useProfile } from '../../hooks/profile/useProfile';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';

export const ChatAppBar = ({
  odinId,
  group = false,
  title,
  goBack,
  isSelf,
  onPress,
}: {
  odinId: string;
  group?: boolean;
  title: string;
  goBack: () => void;
  isSelf?: boolean;
  onPress: () => void;
}) => {
  const user = useProfile().data;
  const { isDarkMode } = useDarkMode();
  const headerLeft = () => (
    <View
      style={{
        flexDirection: 'row',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <HeaderBackButton
        style={{ left: 0, marginRight: Platform.OS === 'ios' ? -10 : 0 }}
        canGoBack={true}
        onPress={goBack}
        labelVisible={false}
        tintColor={isDarkMode ? Colors.white : Colors.black}
      />
      {!group ? (
        isSelf ? (
          <OwnerAvatar style={styles.avatar} imageSize={{ width: 36, height: 36 }} />
        ) : (
          <Avatar odinId={odinId} style={styles.avatar} imageSize={{ width: 36, height: 36 }} />
        )
      ) : (
        <GroupAvatar style={styles.avatar} />
      )}
    </View>
  );
  return (
    <Pressable onPress={onPress}>
      <Header
        title={!isSelf ? title : `${user?.firstName} ${user?.surName} (you)`}
        headerTitleAlign="left"
        headerLeft={headerLeft}
      />
    </Pressable>
  );
};
const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    zIndex: 10,
  },
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
