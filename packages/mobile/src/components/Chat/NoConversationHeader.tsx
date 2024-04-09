import { Platform, View } from 'react-native';
import { Header, HeaderBackButton } from '@react-navigation/elements';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useCallback } from 'react';

export type SelectedMessageProp = {
  onReply: () => void;
  onInfo: () => void;
  onCopy: () => void;
  onDelete: () => void;
};

export const NoConversationHeader = ({
  title,
  goBack,
}: {
  title: string;
  goBack: () => void;
}) => {
  const { isDarkMode } = useDarkMode();
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
          style={{ left: 0, marginRight: Platform.OS === 'ios' ? -10 : 0 }}
          canGoBack={true}
          onPress={goBack}
          labelVisible={false}
          tintColor={isDarkMode ? Colors.white : Colors.black}
        />
      </View>
    ),
    [goBack, isDarkMode]
  );

  return (
    <Header
      title={title}
      headerTitleAlign="center"
      headerLeft={headerLeft}
    />
  );
};
