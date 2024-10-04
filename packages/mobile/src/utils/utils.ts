import { getNewId } from '@homebase-id/js-lib/helpers';
import { InfiniteData } from '@tanstack/react-query';
import { Image, Linking } from 'react-native';
import { CachesDirectoryPath, copyFile } from 'react-native-fs';
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
    url = url.startsWith('http') ? url : `https://${url}`;
    if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
            enableUrlBarHiding: false,
            enableDefaultShare: false,
            animated: true,
        });
    } else Linking.openURL(url);
}

export function extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

// Calculate the scaled dimensions of an image
export function calculateScaledDimensions(
    pixelWidth: number,
    pixelHeight: number,
    maxSize: { width: number; height: number }
) {
    const maxWidth = maxSize.width;
    const maxHeight = maxSize.height;

    // Add a default value for pixelWidth and pixelHeight if the values are zero
    if (pixelHeight === 0) {
        pixelHeight = 300;
    }
    if (pixelWidth === 0) {
        pixelWidth = 300;
    }

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

export async function fixContentURI(url: string, format?: string): Promise<string> {
    if (url.startsWith('content://') && format) {
        const destPath = `${CachesDirectoryPath}/${getNewId()}.${format}`;
        await copyFile(url, destPath);
        return `file://${destPath}`;
    }
    return decodeURI(url);
}

// Utility function to convert Image.getSize to a promise
export const getImageSize = (uri: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve) => {
        Image.getSize(
            uri,
            (width, height) => resolve({ width, height }),
            (error) => {
                console.error('Error getting image size', error);
                resolve({ width: 500, height: 500 });
            }
        );
    });
};

// Flattens all pages, sorts descending and slice on the max number expected
export const flattenInfinteData = <T>(
    rawData:
        | InfiniteData<{
            results: T[];
            cursorState: unknown;
        }>
        | undefined,
    pageSize?: number,
    sortFn?: (a: T, b: T) => number
) => {
    return (rawData?.pages
        .flatMap((page) => page?.results)
        .filter((post) => !!post)
        .sort(sortFn)
        .slice(0, pageSize ? rawData?.pages.length * pageSize : undefined) || []) as T[];
};

export function isBase64ImageURI(url: string): boolean {
    // Regular expression to check for a Base64 image URI
    const base64ImagePattern = /^data:image\/(png|jpeg|jpg|gif|bmp|svg\+xml);base64,([A-Za-z0-9+/=]+)$/;

    // Test the given URL against the regex pattern
    return base64ImagePattern.test(url);
}

// Regular expression for URL parsing
export const URL_PATTERN = new RegExp(
    /((http|https|ftp):\/\/)?(([a-zA-Z0-9\-_]+\.)+[a-zA-Z]{2,})(:\d+)?(\/[^\s]*)?/gi
);

// Function to clean special characters
export function cleanString(input: string): string {
    // Regex to match and remove:
    // 1. Control characters from \u0000 to \u001F and \u007F to \u009F
    // 2. Unicode invisible characters like zero-width space, non-joiner, joiner, etc.
    const cleanedString = input
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '') // Remove control and invisible characters
        .trim(); // Remove leading/trailing whitespace

    return cleanedString;
}
