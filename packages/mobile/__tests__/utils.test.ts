
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { Linking } from 'react-native';
import { calculateScaledDimensions, extractUrls, extractVideoParams, htmlToRecord, isEmojiOnly, millisToMinutesAndSeconds, openURL, cleanDomainString } from '../src/utils/utils';

jest.mock('react-native-inappbrowser-reborn', () => ({
    isAvailable: jest.fn(),
    open: jest.fn(),
}));

jest.mock('react-native', () => ({
    Linking: {
        openURL: jest.fn(),
    },
}));

describe('utils.ts', () => {
    beforeEach(() => {
        (InAppBrowser.isAvailable as jest.Mock).mockClear();
        (InAppBrowser.open as jest.Mock).mockClear();
        (Linking.openURL as jest.Mock).mockClear();

    });
    describe('millisToMinutesAndSeconds', () => {
        it('should convert milliseconds to minutes and seconds', () => {
            expect(millisToMinutesAndSeconds(61000)).toBe('1:01');
            expect(millisToMinutesAndSeconds(60000)).toBe('1:00');
            expect(millisToMinutesAndSeconds(0)).toBe('0:00');
            expect(millisToMinutesAndSeconds(undefined)).toBe('0:00');
        });
    });

    describe('openURL', () => {
        it('should open URL with InAppBrowser if available', async () => {
            (InAppBrowser.isAvailable as jest.Mock).mockResolvedValue(true);
            await openURL('example.com');
            expect(InAppBrowser.open).toHaveBeenCalledWith('https://example.com', expect.any(Object));
        });

        it('should open URL with Linking if InAppBrowser is not available', async () => {
            (InAppBrowser.isAvailable as jest.Mock).mockResolvedValue(false);
            await openURL('example.com');
            expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
        });

        it('should not open URL if it is empty', async () => {
            await openURL('');
            expect(InAppBrowser.open).not.toHaveBeenCalled();
            expect(Linking.openURL).not.toHaveBeenCalled();
        });
    });

    describe('cleanDomainString', () => {
        it('handles valid URL with path and query', () => {
            expect(cleanDomainString('https://example.com/path?query')).toBe('example.com');
        });
        it('preserves Unicode and fixes typos', () => {
            expect(cleanDomainString('http:/æøå.example.com')).toBe('æøå.example.com');
        });
        it('collapses extra slashes', () => {
            expect(cleanDomainString('https:///michael.seifert.page/')).toBe('michael.seifert.page');
        });
        it('removes invalid chars and cleans hyphens', () => {
            expect(cleanDomainString('example--.com#invalid')).toBe('example.com');
        });
        it('handles plain domain with spaces', () => {
            expect(cleanDomainString('example com')).toBe('example.com');
        });
        it('returns empty for invalid/empty input', () => {
            expect(cleanDomainString('///')).toBe('');
        });
    });

    describe('extractUrls', () => {
        it('should extract URLs from text', () => {
            const text = 'Check out https://example.com and http://test.com';
            const urls = extractUrls(text);
            expect(urls).toEqual(['https://example.com', 'http://test.com']);
        });

        it('should return an empty array if no URLs are found', () => {
            const text = 'No URLs here!';
            const urls = extractUrls(text);
            expect(urls).toEqual([]);
        });
    });

    describe('calculateScaledDimensions', () => {
        it('should calculate scaled dimensions', () => {
            const dimensions = calculateScaledDimensions(2000, 1000, { width: 1000, height: 500 });
            expect(dimensions).toEqual({ width: 1000, height: 500 });
        });

        it('should maintain aspect ratio when scaling down', () => {
            const dimensions = calculateScaledDimensions(2000, 1000, { width: 500, height: 500 });
            expect(dimensions).toEqual({ width: 500, height: 250 });
        });
    });
    describe('extractVideoId', () => {
        it('should return the video ID from a youtube.com URL', () => {
            const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
            const videoId = extractVideoParams(url);
            expect(videoId?.videoId).toBe('dQw4w9WgXcQ');
        });
        it('should return the video ID from a youtu.be URL', () => {
            const url = 'https://youtu.be/dQw4w9WgXcQ';
            const videoId = extractVideoParams(url);
            expect(videoId?.videoId).toBe('dQw4w9WgXcQ');
        });
        it('should return null if the URL is invalid', () => {
            const url = 'https://example.com';
            const videoId = extractVideoParams(url);
            expect(videoId).toBeUndefined();
        });

    });
    describe('Emojis only', () => {
        it('text should only contain emojis', () => {
            const text = '😀😀😀';
            const hasEmojis = isEmojiOnly(text);
            expect(hasEmojis).toBeTruthy();
        });
        it('should recognize flags as emojis', () => {
            const text = '🇺🇸🇺🇸🇺🇸';
            const hasEmojis = isEmojiOnly(text);
            expect(hasEmojis).toBeTruthy();
        });
        it('should return false if text contains non-emoji characters', () => {
            const text = 'Hello 😃';
            const hasEmojis = isEmojiOnly(text);
            expect(hasEmojis).toBeFalsy();
        }
        );

    });
});


describe('htmlToRecord', () => {
    test('should convert a simple paragraph to the correct structure', () => {
        const html = `<p>This is a paragraph</p>`;
        const expected = [
            {
                type: 'p',
                children: [{ text: 'This is a paragraph' }],
            },
        ];
        expect(htmlToRecord(html)).toEqual(expected);
    });

    test('should handle bold text within a paragraph', () => {
        const html = `<p>This is <strong>bold</strong> text</p>`;
        const expected = [
            {
                type: 'p',
                children: [
                    { text: 'This is' },
                    { text: 'bold', bold: true },
                    { text: 'text' },
                ],
            },
        ];
        expect(htmlToRecord(html)).toEqual(expected);
    });

    test('should handle nested styles like bold and italic', () => {
        const html = `<p>This is <strong><em>bold and italic</em></strong> text</p>`;
        const expected = [
            {
                type: 'p',
                children: [
                    { text: 'This is' },
                    { text: 'bold and italic', bold: true, italic: true },
                    { text: 'text' },
                ],
            },
        ];
        expect(htmlToRecord(html)).toEqual(expected);
    });

    test('should handle lists with nested children', () => {
        const html = `
      <ul>
        <li>First item</li>
        <li>
         <p> <strong>Second item</strong> with more text</p>
        </li>
        <li>
         <p> <em>Third</em><u>item</u> with styles </p>
        </li>
      </ul>
    `;
        const expected = [
            {
                type: 'ul',
                children: [
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'lic',
                                children: [{ text: 'First item' }],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'lic',
                                children: [
                                    {
                                        type: 'p', children: [
                                            { text: 'Second item', bold: true },
                                            { text: 'with more text' },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'lic',
                                children: [
                                    {
                                        type: 'p', children: [
                                            { text: 'Third', italic: true },
                                            { text: 'item', underline: true },
                                            { text: 'with styles' },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];

        expect(htmlToRecord(html)).toEqual(expected);
    });


    test('should handle empty tags gracefully', () => {
        const html = `<p></p><ul><li></li></ul>`;
        const expected = [
            {
                type: 'p',
                children: [{ text: '' }],
            },
            {
                type: 'ul',
                children: [
                    {
                        type: 'li',
                        children: [
                        ],
                    },
                ],
            },
        ];
        expect(htmlToRecord(html)).toEqual(expected);
    });

    test('should handle multiple paragraphs', () => {
        const html = `<p>First paragraph</p><p>Second paragraph</p>`;
        const expected = [
            {
                type: 'p',
                children: [{ text: 'First paragraph' }],
            },
            {
                type: 'p',
                children: [{ text: 'Second paragraph' }],
            },
        ];
        expect(htmlToRecord(html)).toEqual(expected);
    });

    test('should handle mixed content with lists and paragraphs', () => {
        const html = `
      <p>This is a paragraph</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
      <p>Another paragraph</p>
    `;
        const expected = [
            {
                type: 'p',
                children: [{ text: 'This is a paragraph' }],
            },
            {
                type: 'ul',
                children: [
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'lic',
                                children: [{ text: 'List item 1' }],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'lic',
                                children: [{ text: 'List item 2' }],
                            },
                        ],
                    },
                ],
            },
            {
                type: 'p',
                children: [{ text: 'Another paragraph' }],
            },
        ];
        expect(htmlToRecord(html)).toEqual(expected);
    });
});

