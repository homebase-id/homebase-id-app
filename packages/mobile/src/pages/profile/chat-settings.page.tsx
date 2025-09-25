import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../app/ProfileStack';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';

import { t } from 'homebase-id-app-common';
import { StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { Colors } from '../../app/Colors';
import { useChatSettingsContext } from '../../components/Settings/useChatSettingsContext';
import { Text } from '../../components/ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';

interface SettingOptionProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isDarkMode: boolean;
}

const SettingOption = ({
  title,
  description,
  value,
  onValueChange,
  isDarkMode,
}: SettingOptionProps) => {
  return (
    <>
      <View
        style={[
          styles.optionContainer,
          { backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100] },
        ]}
      >
        <Text style={styles.optionTitle}>{title}</Text>
        <Switch value={value} onValueChange={onValueChange} />
      </View>
      <View style={styles.descriptionContainer}>
        <Text
          style={[
            styles.descriptionText,
            { color: isDarkMode ? Colors.slate[400] : Colors.slate[600] },
          ]}
        >
          {description}
        </Text>
      </View>
    </>
  );
};

type ChatSettingsPageProp = NativeStackScreenProps<ProfileStackParamList, 'ChatSettings'>;

export const ChatSettingsPage = (_: ChatSettingsPageProp) => {
  const { isDarkMode } = useDarkMode();
  const { allowYoutubePlayback, setAllowYoutubePlayback, useLegendList, setUseLegendList } =
    useChatSettingsContext();

  return (
    <SafeAreaView>
      <SettingOption
        title={t('Allow Youtube player in chat')}
        description={t(
          'This setting will allow you to play youtube videos inside the chat directly.'
        )}
        value={allowYoutubePlayback}
        onValueChange={setAllowYoutubePlayback}
        isDarkMode={isDarkMode}
      />

      <SettingOption
        title={t('Optimized chat rendering')}
        description={t(
          'Enable optimized list rendering for better performance with large chat histories. Provides smoother scrolling and improved memory usage.'
        )}
        value={useLegendList}
        onValueChange={setUseLegendList}
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  optionContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignContent: 'space-between',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  descriptionContainer: {
    marginHorizontal: 22,
    marginTop: 12,
  },
  descriptionText: {
    fontWeight: '300',
  },
});
