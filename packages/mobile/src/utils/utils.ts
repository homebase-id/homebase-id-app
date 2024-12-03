import { getNewId } from '@homebase-id/js-lib/helpers';
import { InfiniteData } from '@tanstack/react-query';
import { Image, Linking } from 'react-native';
import { CachesDirectoryPath, copyFile } from 'react-native-fs';
import { Asset } from 'react-native-image-picker';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { ImageSource } from '../provider/image/RNImageProvider';
import { Parser, DomHandler } from 'htmlparser2';
import { RichText } from '@homebase-id/js-lib/core';


//https://stackoverflow.com/a/21294619/15538463
export function millisToMinutesAndSeconds(millis: number | undefined): string {
  if (!millis) return '0:00';
  const minutes = Math.floor(millis / 60000);
  const seconds = Number(((millis % 60000) / 1000).toFixed(0));
  return seconds === 60 ? minutes + 1 + ':00' : minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
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

export async function copyFileIntoCache(url: string, contentType?: string): Promise<string> {
  if (!isBase64ImageURI(url)) {
    // We take a copy of the file, as it can be a virtual file that is not accessible by the native code; Eg: ImageResizer
    const targetPath = `file://${CachesDirectoryPath}/${getNewId()}${contentType ? `.${getExtensionForMimeType(contentType)}` : ''}`;
    await copyFile(url, targetPath);

    return targetPath;
  }
  return url;
}

// Utility function to convert Image.getSize to a promise
export const getImageSize = (uri: string): Promise<{ width: number; height: number }> => {
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
  const base64ImagePattern =
    /^data:image\/(png|jpeg|jpg|gif|bmp|svg\+xml);base64,([A-Za-z0-9+/=]+)$/;

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

export function assetsToImageSource(assets: Asset[], key?: string): ImageSource[] {
  return assets.map((value) => {
    return {
      height: value.height || 0,
      width: value.width || 0,
      name: value.fileName,
      type: value.type && value.type === 'image/jpg' ? 'image/jpeg' : value.type,
      uri: value.uri,
      filename: value.fileName,
      date: Date.parse(value.timestamp || new Date().toUTCString()),
      filepath: value.originalPath,
      id: value.id,
      fileSize: value.fileSize,
      key: assets?.length === 1 ? key : undefined,
    };
  });
}

export const getExtensionForMimeType = (mimeType: string | undefined | null) => {
  if (!mimeType) return 'bin';
  return mimeType === 'audio/mpeg'
    ? 'mp3'
    : mimeType === 'image/svg+xml'
      ? 'svg'
      : mimeType === 'application/vnd.apple.mpegurl'
        ? 'm3u8'
        : mimeType === 'video/mp2t'
          ? 'ts'
          : mimeType.split('/')[1];
};


/*
Extract VideoId from the given youtube url
*/
export function extractVideoParams(url: string): {
  videoId: string | null | undefined;
  start?: string | null | undefined;
  end?: string | null | undefined;
} | undefined {
  if (!url) return;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const uri = new URL(url);
    if (uri.hostname === 'youtu.be') {
      return { videoId: uri.pathname.substring(1), start: uri.searchParams.get('t') };
    }
    return {
      videoId: uri.searchParams.get('v'),
      start: uri.searchParams.get('t'),
      end: uri.searchParams.get('end'),
    };
  }
  return;
}

export function isYoutubeURL(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export function isEmojiOnly(text: string | undefined): boolean {
  return ((text?.match(/^\p{Extended_Pictographic}/u) || text?.match(/^\p{Emoji_Component}/u)) &&
    !text?.match(/[0-9a-zA-Z]/)) ??
    false;
}

export function htmlToRecord(htmlString: string): RichText {
  const handler = new DomHandler((error, _) => {
    if (error) {
      throw error;
    }
  });
  const parser = new Parser(handler);
  parser.write(htmlString);
  parser.end();

  function processNode(node: any): Record<string, unknown> | null {
    if (node.type === 'text' && node.data.trim()) {
      return { text: node.data.trim() };
    }

    if (node.type === 'tag') {
      const children = (node.children || []).map(processNode).filter(Boolean);

      const attributes = node.attribs || {};

      return {
        type: node.name,
        ...(Object.keys(attributes).length > 0 && { attributes }),
        ...(children.length > 0 && { children }),
      };
    }

    return null;
  }

  const result = handler.dom.map(processNode).filter(Boolean) as RichText;

  return result;
}


