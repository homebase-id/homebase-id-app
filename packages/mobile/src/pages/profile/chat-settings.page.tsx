import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../app/ProfileStack';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';

import { t } from 'homebase-id-app-common';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { Colors } from '../../app/Colors';
import { useChatSettingsContext } from '../../components/Settings/useChatSettingsContext';
import { Text } from '../../components/ui/Text/Text';
import { useDarkMode } from '../../hooks/useDarkMode';
import type { ListImplementationType } from 'react-native-gifted-chat/lib/MessageContainerSwitch';

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

interface ListImplementationOptionProps {
  title: string;
  description: string;
  value: ListImplementationType;
  currentValue: ListImplementationType;
  onValueChange: (value: ListImplementationType) => void;
  isDarkMode: boolean;
}

const ListImplementationOption = ({
  title,
  description,
  value,
  currentValue,
  onValueChange,
  isDarkMode,
}: ListImplementationOptionProps) => {
  const isSelected = value === currentValue;

  return (
    <TouchableOpacity onPress={() => onValueChange(value)}>
      <View
        style={[
          styles.optionContainer,
          {
            backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100],
            borderWidth: isSelected ? 2 : 0,
            borderColor: isSelected ? (isDarkMode ? Colors.indigo[400] : Colors.indigo[600]) : undefined,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionTitle, isSelected && { fontWeight: '600' }]}>{title}</Text>
          <Text
            style={[
              styles.inlineDescription,
              { color: isDarkMode ? Colors.slate[400] : Colors.slate[600] },
            ]}
          >
            {description}
          </Text>
        </View>
        {isSelected && (
          <View style={[
            styles.checkmark,
            { backgroundColor: isDarkMode ? Colors.indigo[400] : Colors.indigo[600] }
          ]}>
            <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

type ChatSettingsPageProp = NativeStackScreenProps<ProfileStackParamList, 'ChatSettings'>;

export const ChatSettingsPage = (_: ChatSettingsPageProp) => {
  const { isDarkMode } = useDarkMode();
  const { allowYoutubePlayback, setAllowYoutubePlayback, listImplementation, setListImplementation } =
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

      <View style={styles.sectionContainer}>
        <Text style={[
          styles.sectionTitle,
          { color: isDarkMode ? Colors.slate[300] : Colors.slate[700] }
        ]}>
          {t('Chat Rendering Engine')}
        </Text>

        <ListImplementationOption
          title={t('Flash List')}
          description={t('Newest high-performance list with optimized memory usage')}
          value="flash"
          currentValue={listImplementation}
          onValueChange={setListImplementation}
          isDarkMode={isDarkMode}
        />

        <ListImplementationOption
          title={t('Legend List')}
          description={t('Alternative optimized list with smooth scrolling')}
          value="legend"
          currentValue={listImplementation}
          onValueChange={setListImplementation}
          isDarkMode={isDarkMode}
        />

        <ListImplementationOption
          title={t('Legacy')}
          description={t('Original FlatList implementation')}
          value="legacy"
          currentValue={listImplementation}
          onValueChange={setListImplementation}
          isDarkMode={isDarkMode}
        />
      </View>
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
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 22,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inlineDescription: {
    fontSize: 13,
    fontWeight: '300',
    marginTop: 4,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
