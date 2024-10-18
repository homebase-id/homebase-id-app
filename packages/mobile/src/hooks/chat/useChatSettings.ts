import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const ALLOW_YOUTUBE_PLAYBACK = 'youtubeplayback';

export const useChatSettings = () => {
    const [allowYoutubePlayback, setAllowYoutubePlayback] = useState<boolean>(true);

    // Fetching default value
    useEffect(() => {
        (async () => {
            const value = await AsyncStorage.getItem(ALLOW_YOUTUBE_PLAYBACK);
            setAllowYoutubePlayback(value === 'true');
        })();
    }, []);

    // When state changes, save to AsyncStorage
    useEffect(() => {
        (async () => {
            if (!allowYoutubePlayback) return;
            await AsyncStorage.setItem(ALLOW_YOUTUBE_PLAYBACK, allowYoutubePlayback ? 'true' : 'false');
        })();
    }, [allowYoutubePlayback]);

    return { allowYoutubePlayback: allowYoutubePlayback, setAllowYoutubePlayback };
};
