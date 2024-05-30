
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';

export type ThemeMode = 'System' | 'Light' | 'Dark';
const THEME = 'theme';

export const useDarkMode = () => {
  const prefersDarkMode = useColorScheme() === 'dark';

  const finalChoice = prefersDarkMode;

  return {
    isDarkMode: finalChoice,
  };
};

export const useThemeMode = () => {

  // const localPreference = localStorage.getItem(LOCALSTORAGE_KEY);
  const [themeMode, setThemeMode] = useState<ThemeMode>('System');

  const setTheme = (theme: ThemeMode) => {
    setThemeMode(theme);
    AsyncStorage.setItem(THEME, theme);
    const newTheme = (theme === 'System' ? null : theme.toLowerCase()) as ColorSchemeName | null | undefined;
    Appearance.setColorScheme(newTheme);
  };

  useEffect(() => {
    AsyncStorage.getItem(THEME).then((theme) => {
      if (theme) {
        setThemeMode(theme as ThemeMode);
      }
    });

  }, []);

  return {
    themeMode,
    setTheme,
  };
};
