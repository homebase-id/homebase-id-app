import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, GroupAvatar } from './Conversation-tile';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { useProfile } from 'feed-app-common';

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
  const headerLeft = () => (
    <View
      style={{
        flexDirection: 'row',
        display: 'flex',
        alignItems: 'center',
      }}>
      <HeaderBackButton
        style={{ left: 0 }}
        canGoBack={true}
        onPress={goBack}
        label={''}
        labelVisible={false}
        // tintColor={isDarkMode ? Colors.white : Colors.black}
      />
      {!group ? (
        <Avatar odinId={odinId} style={styles.avatar} />
      ) : (
        <GroupAvatar style={styles.avatar} />
      )}
    </View>
  );
  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.header,
          {
            // marginTop: insets.top,
            top: 0,
            left: 0,
            right: 0,
            paddingVertical: 3,
            width: '100%',
            zIndex: 10,
            // backgroundColor: 'black',
          },
        ]}>
        <Header
          title={!isSelf ? title : `${user?.firstName} ${user?.surName} (you)`}
          headerTitleAlign="left"
          headerLeft={headerLeft}
        />
      </View>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    // flex: 1,
  },
  titleStyle: {
    fontSize: 18,
    fontWeight: '500',
  },
  avatar: {
    width: 36,
    height: 36,
    marginRight: 0,
  },
});
