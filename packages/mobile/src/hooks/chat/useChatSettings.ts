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

    const setYoutubePlayback = async (allow: boolean) => {
        setAllowYoutubePlayback(allow);
        await AsyncStorage.setItem(ALLOW_YOUTUBE_PLAYBACK, allow ? 'true' : 'false');
    };

    return { allowYoutubePlayback: allowYoutubePlayback, setYoutubePlayback };
};
