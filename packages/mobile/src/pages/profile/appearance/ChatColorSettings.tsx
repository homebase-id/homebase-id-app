import { Text } from '../../../components/ui/Text/Text';
import { SafeAreaView } from '../../../components/ui/SafeAreaView/SafeAreaView';
import { Container } from '../../../components/ui/Container/Container';
import { FlatList, ListRenderItemInfo, View } from 'react-native';
import { BUBBLE_COLORS, ChatColor } from '../../../utils/bubble_colors';
import { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';

export const ChatColorSettings = () => {
  const renderItem = useCallback(({ item }: ListRenderItemInfo<ChatColor>) => {
    const radius = 60;
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
          start={gradient.start}
          end={gradient.end}
          style={{ width: radius, height: radius, borderRadius: radius }}
        />
      );
    }
    return <></>;
  }, []);

  return (
    <SafeAreaView>
      <Container>
        <Text>Chat Color Settings</Text>
        <FlatList
          data={BUBBLE_COLORS}
          style={{ marginLeft: 12 }}
          numColumns={4}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            gap: 15,
          }}
          columnWrapperStyle={{
            gap: 15,
          }}
          renderItem={renderItem}
        />
      </Container>
    </SafeAreaView>
  );
};
