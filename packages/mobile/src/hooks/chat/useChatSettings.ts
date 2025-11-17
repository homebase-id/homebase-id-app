import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type { ListImplementationType } from 'react-native-gifted-chat/lib/MessageContainerSwitch';

const ALLOW_YOUTUBE_PLAYBACK = 'youtubeplayback';
const LIST_IMPLEMENTATION = 'listimplementation';

export const useChatSettings = () => {
  const [allowYoutubePlayback, setAllowYoutubePlayback] = useState<boolean>(true);
  const [listImplementation, setListImplementation] = useState<ListImplementationType>('flash'); // Default to flash

  // Fetching default values
  useEffect(() => {
    (async () => {
      const youtubeValue = await AsyncStorage.getItem(ALLOW_YOUTUBE_PLAYBACK);
      setAllowYoutubePlayback(youtubeValue === 'true');

      const listValue = await AsyncStorage.getItem(LIST_IMPLEMENTATION);
      if (listValue === 'legend' || listValue === 'flash' || listValue === 'legacy') {
        setListImplementation(listValue);
      } else {
        setListImplementation('flash'); // Default to flash if not set or invalid
      }
    })();
  }, []);

  const setYoutubePlayback = async (allow: boolean) => {
    setAllowYoutubePlayback(allow);
    await AsyncStorage.setItem(ALLOW_YOUTUBE_PLAYBACK, allow ? 'true' : 'false');
  };

  const setListType = async (type: ListImplementationType) => {
    setListImplementation(type);
    await AsyncStorage.setItem(LIST_IMPLEMENTATION, type);
  };

  return {
    allowYoutubePlayback: allowYoutubePlayback,
    setYoutubePlayback,
    listImplementation: listImplementation,
    setListType,
  };
};
