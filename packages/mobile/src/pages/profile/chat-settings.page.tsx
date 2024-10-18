import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../app/ProfileStack';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';

import { useDarkMode } from '../../hooks/useDarkMode';
import { Text } from '../../components/ui/Text/Text';
import { t } from 'homebase-id-app-common';
import { Colors } from '../../app/Colors';
import { View } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { useChatSettingsContext } from '../../components/Settings/useChatSettingsContext';

type ChatSettingsPageProp = NativeStackScreenProps<ProfileStackParamList, 'ChatSettings'>;
export const ChatSettingsPage = (_: ChatSettingsPageProp) => {
  const { isDarkMode } = useDarkMode();
  const { allowYoutubePlayback, setAllowYoutubePlayback } = useChatSettingsContext();
  return (
    <SafeAreaView>
      <View
        style={{
          backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100],
          marginTop: 8,
          marginHorizontal: 6,
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderRadius: 16,
          alignContent: 'space-between',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: '400',
          }}
        >
          {t('Allow Youtube player in chat')}
        </Text>
        <Switch
          value={allowYoutubePlayback}
          onValueChange={(val) => setAllowYoutubePlayback(val)}
        />
      </View>
    </SafeAreaView>
  );
};
