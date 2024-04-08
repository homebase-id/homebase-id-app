import { Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';

//https://stackoverflow.com/a/21294619/15538463
export function millisToMinutesAndSeconds(millis: number | undefined): string {
    if (!millis) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = Number(((millis % 60000) / 1000).toFixed(0));
    return seconds === 60
        ? minutes + 1 + ':00'
        : minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

export async function openURL(url: string): Promise<void> {
    if (!url) return;
    if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
            enableUrlBarHiding: false,
            enableDefaultShare: false,
            animated: true,
        });
    } else Linking.openURL(url);
}
