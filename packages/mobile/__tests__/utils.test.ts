
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { Linking } from 'react-native';
import { calculateScaledDimensions, extractUrls, millisToMinutesAndSeconds, openURL } from '../src/utils/utils';

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
});
