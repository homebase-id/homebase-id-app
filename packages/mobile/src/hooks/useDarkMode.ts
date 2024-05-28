
import { useColorScheme } from 'react-native';

// const LOCALSTORAGE_KEY = 'prefersDark';
export const IS_DARK_CLASSNAME = 'dark';

export const useDarkMode = () => {
  const prefersDarkMode = useColorScheme() === 'dark';

  // const localPreference = localStorage.getItem(LOCALSTORAGE_KEY);

  const finalChoice =
    // localPreference !== undefined ? localPreference === '1' :
    prefersDarkMode;

  // const setDocumentClass = (isDarkMode: boolean) => {
  //   if (isDarkMode) {
  //     document.documentElement.classList.add(IS_DARK_CLASSNAME);
  //   } else {
  //     document.documentElement.classList.remove(IS_DARK_CLASSNAME);
  //   }
  // };

  // setDocumentClass(finalChoice);

  // const toggleDarkMode = () => {
  //   const wasDarkMode =
  //     document.documentElement.classList.contains(IS_DARK_CLASSNAME);

  //   localStorage.setItem(LOCALSTORAGE_KEY, wasDarkMode ? '0' : '1');
  //   setDocumentClass(!wasDarkMode);
  // };

  return {
    // toggleDarkMode,
    isDarkMode: finalChoice,
  };
};
