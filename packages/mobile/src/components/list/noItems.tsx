import { View, Text } from 'react-native';

const NoItems = ({ children }: { children: string }) => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: 16 }}>{children}</Text>
    </View>
  );
};

export default NoItems;
