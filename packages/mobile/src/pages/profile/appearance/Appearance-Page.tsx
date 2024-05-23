import {
  Appearance,
  FlatList,
  Platform,
  StyleSheet,
  TextStyle,
  TouchableHighlight,
  View,
} from 'react-native';
import { SafeAreaView } from '../../../components/ui/SafeAreaView/SafeAreaView';
import { Text } from '../../../components/ui/Text/Text';
import { Container } from '../../../components/ui/Container/Container';
import { Colors } from '../../../app/Colors';
import { Divider } from '../../../components/ui/Divider';
import { useEffect, useState } from 'react';
import Dialog from 'react-native-dialog';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../../app/ProfileStack';

type TileProp = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

type AppearanceProp = NativeStackScreenProps<ProfileStackParamList, 'Appearance'>;

export const AppearancePage = (_: AppearanceProp) => {
  const [theme, setTheme] = useState(Appearance.getColorScheme());
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme);
    });

    return subscription.remove;
  }, []);

  const [dialogVisible, setDialogVisible] = useState(false);

  const isIos = Platform.OS === 'ios';
  const isDarkMode = theme === 'dark';
  let currTheme = theme === null && !theme ? 'System' : (theme as string);
  currTheme = currTheme?.charAt(0).toUpperCase() + currTheme?.slice(1);
  const tiles: TileProp[] = [
    {
      title: 'Theme',
      subtitle: `${currTheme}`,
      onPress: () => {
        setDialogVisible(true);
      },
    },
    {
      title: 'Chat Color & Wallpaper',
      onPress: () => {
        //TODO:
      },
    },
  ];

  return (
    <SafeAreaView>
      <Container
        style={{
          flex: 1,
        }}
      >
        <FlatList
          data={tiles}
          renderItem={({ item, index }) => {
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
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
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
          }}
        />
        <Dialog.Container visible={dialogVisible} onBackdropPress={() => setDialogVisible(false)}>
          <Dialog.Title>Theme</Dialog.Title>
          <RadioButtonTile
            isSelected={theme === null || !theme}
            onPress={() => {
              setDialogVisible(false);
              Appearance.setColorScheme(null);
            }}
            title="System"
          />
          <RadioButtonTile
            isSelected={theme === 'light'}
            onPress={() => {
              setDialogVisible(false);
              Appearance.setColorScheme('light');
            }}
            title="Light"
          />
          <RadioButtonTile
            isSelected={theme === 'dark'}
            onPress={() => {
              setDialogVisible(false);
              Appearance.setColorScheme('dark');
            }}
            title="Dark"
          />
        </Dialog.Container>
      </Container>
    </SafeAreaView>
  );
};

function RadioButtonTile({
  isSelected,
  onPress,
  title,
}: {
  isSelected: boolean;
  onPress: () => void;
  title: string;
}) {
  const { isDarkMode } = useDarkMode();
  const radioButton = () => (
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
}

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
