import { SafeAreaView } from '../../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../../components/ui/Container/Container';
import { FlatList, ListRenderItemInfo, View, ViewStyle } from 'react-native';
import { BUBBLE_COLORS, ChatColor } from '../../../utils/bubble_colors';
import { useCallback, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { ScrollView } from 'react-native-gesture-handler';
import { IMessage, Message, MessageProps } from 'react-native-gifted-chat';

export const ChatColorSettings = () => {
  const renderItem = useCallback(({ item }: ListRenderItemInfo<ChatColor>) => {
    const radius = 62;
    if (item.color) {
      return (
        <View
          style={{
            width: radius,
            height: radius,
            borderRadius: radius,
            backgroundColor: item.color,
          }}
        />
      );
    } else if (item.gradient) {
      const gradient = item.gradient;

      return (
        <LinearGradient
          colors={gradient.colors}
          useAngle={true}
          angle={gradient.angle}
          style={{ width: radius, height: radius, borderRadius: radius }}
        />
      );
    }
    return <></>;
  }, []);
  const messaageProps = useMemo(() => {
    const receiverMessageProp: MessageProps<IMessage> = {
      position: 'left',
      key: '0',
      user: {
        _id: 2,
        name: 'Receiver',
      },
      currentMessage: {
        _id: 'receiver_msg',
        text: "Here's a preview of color bubble",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Receiver',
        },
      },

      showUserAvatar: false,
    };
    const senderMessageProp: MessageProps<IMessage> = {
      position: 'right',
      key: '1',
      user: {
        _id: 1,
        name: 'Me',
      },
      currentMessage: {
        _id: 'sender_msg',
        text: 'The color is visible only to you',
        createdAt: new Date(),
        user: {
          _id: 1,
          name: 'Me',
        },
      },
      previousMessage: receiverMessageProp.currentMessage,

      showUserAvatar: false,
    };
    return {
      receiver: receiverMessageProp,
      sender: senderMessageProp,
    };
  }, []);

  const { isDarkMode } = useDarkMode();
  const containerStyle = useMemo(() => {
    return {
      backgroundColor: isDarkMode ? Colors.slate[800] : Colors.slate[200],
      padding: 18,
      borderRadius: 15,
      marginVertical: 12,
    } as Readonly<ViewStyle>;
  }, [isDarkMode]);

  return (
    <SafeAreaView>
      <Container>
        <ScrollView>
          {/* Render Sample Color bubble */}
          <View
            style={[
              containerStyle,
              {
                height: 150,
                padding: 0,
                margin: 16,
              },
            ]}
          >
            <Message {...messaageProps.receiver} />
            <Message {...messaageProps.sender} />
          </View>

          {/* Render Colors */}
          <FlatList
            data={BUBBLE_COLORS}
            style={{ ...containerStyle, marginLeft: 'auto', marginRight: 'auto' }}
            numColumns={4}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{
              gap: 18,
            }}
            columnWrapperStyle={{
              gap: 22,
            }}
            renderItem={renderItem}
          />
        </ScrollView>
      </Container>
    </SafeAreaView>
  );
};
