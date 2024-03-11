import { View, Text } from 'react-native';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Colors } from '../../app/Colors';

const NoItems = ({ children }: { children: string }) => {
  const { isDarkMode } = useDarkMode();

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
      }}
    >
      <Text style={{ fontSize: 16, color: isDarkMode ? Colors.white : Colors.black }}>
        {children}
      </Text>
    </View>
  );
};

export default NoItems;
