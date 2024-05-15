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

// Calculate the scaled dimensions of an image
export function calculateScaledDimensions(
    pixelWidth: number,
    pixelHeight: number,
    maxSize: { width: number; height: number }
) {
    const maxWidth = maxSize.width;
    const maxHeight = maxSize.height;

    let newWidth, newHeight;

    // Check if the width needs to be scaled down
    if (pixelWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = (pixelHeight * maxWidth) / pixelWidth;
    } else {
        newWidth = pixelWidth;
        newHeight = pixelHeight;
    }

    // If after scaling the height exceeds the maxHeight, scale down the height
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = (pixelWidth * maxHeight) / pixelHeight;
    }

    return { width: newWidth, height: newHeight };
}

export function getPayloadSize(size: number): string {
    if (size < 1024) {
        return `${size.toFixed(0)} Bytes`;
    } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(0)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(0)} MB`;
    } else {
        return `${(size / (1024 * 1024 * 1024)).toFixed(0)} GB`;
    }
}

// This is needed when some files has file:// already prefixed with it
// Needs to be removed to avoid double file://
// decode the URI component
// see: https://github.com/react-native-documents/document-picker/issues/350#issuecomment-705437360
export function fixDocumentURI(url: string): string {
    const prefixFile = 'file://';
    if (url.startsWith(prefixFile)) {
        url = url.substring(prefixFile.length);
        url = decodeURI(url);
    }
    return url;

}

