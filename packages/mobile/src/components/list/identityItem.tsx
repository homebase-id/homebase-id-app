import { View, Text } from 'react-native';

export const IdentityItem = ({ odinId }: { odinId: string }) => {
  return (
    <View>
      <Text>{odinId}</Text>
    </View>
  );
};

export default IdentityItem;
