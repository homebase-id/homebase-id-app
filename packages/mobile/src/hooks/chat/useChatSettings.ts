import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const ALLOW_YOUTUBE_PLAYBACK = 'youtubeplayback';
const USE_LEGEND_LIST = 'uselegendlist';

export const useChatSettings = () => {
  const [allowYoutubePlayback, setAllowYoutubePlayback] = useState<boolean>(true);
  const [useLegendList, setUseLegendList] = useState<boolean>(true); // Default to true (Legend List)

  // Fetching default values
  useEffect(() => {
    (async () => {
      const youtubeValue = await AsyncStorage.getItem(ALLOW_YOUTUBE_PLAYBACK);
      setAllowYoutubePlayback(youtubeValue === 'true');

      const legendListValue = await AsyncStorage.getItem(USE_LEGEND_LIST);
      setUseLegendList(legendListValue === null ? true : legendListValue === 'true'); // Default true if not set
    })();
  }, []);

  const setYoutubePlayback = async (allow: boolean) => {
    setAllowYoutubePlayback(allow);
    await AsyncStorage.setItem(ALLOW_YOUTUBE_PLAYBACK, allow ? 'true' : 'false');
  };

  const setLegendListUsage = async (useLegend: boolean) => {
    setUseLegendList(useLegend);
    await AsyncStorage.setItem(USE_LEGEND_LIST, useLegend ? 'true' : 'false');
  };

  return {
    allowYoutubePlayback: allowYoutubePlayback,
    setYoutubePlayback,
    useLegendList: useLegendList,
    setLegendListUsage,
  };
};
