import {
  FlatList,
  Platform,
  StyleSheet,
  TextStyle,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '../../../components/ui/SafeAreaView/SafeAreaView';
import { Text } from '../../../components/ui/Text/Text';
import { Container } from '../../../components/ui/Container/Container';
import { Colors } from '../../../app/Colors';
import { Divider } from '../../../components/ui/Divider';
import React, { useCallback, useState } from 'react';
import Dialog from 'react-native-dialog';
import { useDarkMode, useThemeMode } from '../../../hooks/useDarkMode';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../../app/ProfileStack';
import { ChevronRight } from '../../../components/ui/Icons/icons';

type TileProp = {
  title: string;
  subtitle?: string;
  trailing?: React.FC;
  showTrailingIcon?: boolean;
  onPress: () => void;
};

type AppearanceProp = NativeStackScreenProps<ProfileStackParamList, 'Appearance'>;

export const AppearancePage = ({ navigation }: AppearanceProp) => {
  const { themeMode, setTheme } = useThemeMode();
  const [dialogVisible, setDialogVisible] = useState(false);

  const { isDarkMode } = useDarkMode();
  const tiles: TileProp[] = [
    {
      title: 'Theme',
      subtitle: `${themeMode}`,
      onPress: () => {
        setDialogVisible(true);
      },
    },
    {
      title: 'Chat Color',
      showTrailingIcon: true,
      onPress: () => {
        navigation.navigate('ChatColorSettings');
      },
    },
  ];

  const renderItem = useCallback(
    ({ item, index }: { item: TileProp; index: number }) => {
      return (
        <TouchableHighlight
          underlayColor={isDarkMode ? Colors.gray[700] : Colors.gray[300]}
          onPress={item.onPress}
          style={{
            backgroundColor: isDarkMode ? Colors.indigo[900] : Colors.indigo[100],
            marginBottom: index === tiles.length - 1 ? 8 : 0,
            borderTopEndRadius: index === 0 ? 16 : 0,
            borderTopStartRadius: index === 0 ? 16 : 0,
            borderEndEndRadius: index === tiles.length - 1 ? 16 : 0,
            borderEndStartRadius: index === tiles.length - 1 ? 16 : 0,
            marginTop: index === 0 ? 8 : 0,
            marginHorizontal: 6,
          }}
        >
          <View
            style={[
              styles.tile,
              {
                paddingBottom: index === tiles.length - 1 ? 16 : 0,
              },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={styles.title}>{item.title}</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={styles.subtitle}>{item.subtitle}</Text>
                {item.trailing && <item.trailing />}
                {item.showTrailingIcon && <ChevronRight />}
              </View>
            </View>
            {index !== tiles.length - 1 && (
              <>
                <View
                  style={{
                    height: 10,
                  }}
                />
                <Divider
                  style={{
                    width: '95%',
                    alignSelf: 'flex-end',
                    borderBottomWidth: 1,
                    borderBottomColor: isDarkMode ? Colors.gray[500] : Colors.gray[300],

                    flex: 1,
                  }}
                />
              </>
            )}
          </View>
        </TouchableHighlight>
      );
    },
    [isDarkMode, tiles.length]
  );

  return (
    <SafeAreaView>
      <Container
        style={{
          flex: 1,
        }}
      >
        <FlatList data={tiles} renderItem={renderItem} />
        <Dialog.Container visible={dialogVisible} onBackdropPress={() => setDialogVisible(false)}>
          <Dialog.Title>Theme</Dialog.Title>
          <RadioButtonTile
            isSelected={themeMode === 'System'}
            onPress={() => {
              setDialogVisible(false);
              setTheme('System');
            }}
            title="System"
          />
          <RadioButtonTile
            isSelected={themeMode === 'Light'}
            onPress={() => {
              setDialogVisible(false);
              setTheme('Light');
            }}
            title="Light"
          />
          <RadioButtonTile
            isSelected={themeMode === 'Dark'}
            onPress={() => {
              setDialogVisible(false);
              setTheme('Dark');
            }}
            title="Dark"
          />
        </Dialog.Container>
      </Container>
    </SafeAreaView>
  );
};

const RadioButtonTile = ({
  isSelected,
  onPress,
  title,
}: {
  isSelected: boolean;
  onPress: () => void;
  title: string;
}) => {
  const { isDarkMode } = useDarkMode();
  const radioButton = useCallback(
    () => (
      <View
        style={[
          {
            height: 24,
            width: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isDarkMode ? Colors.indigo[700] : Colors.indigo[500],
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {isSelected ? (
          <View
            style={{
              height: 12,
              width: 12,
              borderRadius: 6,
              backgroundColor: isDarkMode ? Colors.indigo[700] : Colors.indigo[500],
            }}
          />
        ) : null}
      </View>
    ),
    [isDarkMode, isSelected]
  );
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        marginBottom: 16,
        marginLeft: 16,
      }}
    >
      {radioButton()}
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignContent: 'space-between',
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  title: Platform.select({
    ios: {
      fontSize: 18,
      fontWeight: 400,
    },
    android: {
      fontSize: 20,
      fontWeight: 400,
    },
  }) as unknown as TextStyle,
  subtitle: {
    fontSize: 16,
  },
});
