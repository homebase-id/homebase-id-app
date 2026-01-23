import { Platform } from 'react-native';

/**
 * Lumi Typography System
 * Based on Nunito font family from the Lumi Design Guide
 * 
 * Usage:
 * - Headings: Typography.fontFamily.bold
 * - Tags/Medium text: Typography.fontFamily.semiBold
 * - Body/Comments: Typography.fontFamily.regular or Typography.fontFamily.semiBold
 */
export const Typography = {
    fontFamily: {
        regular: Platform.select({
            ios: 'Nunito-Regular',
            android: 'Nunito-Regular',
        }),
        medium: Platform.select({
            ios: 'Nunito-Medium',
            android: 'Nunito-Medium',
        }),
        semiBold: Platform.select({
            ios: 'Nunito-SemiBold',
            android: 'Nunito-SemiBold',
        }),
        bold: Platform.select({
            ios: 'Nunito-Bold',
            android: 'Nunito-Bold',
        }),
        extraBold: Platform.select({
            ios: 'Nunito-ExtraBold',
            android: 'Nunito-ExtraBold',
        }),
        black: Platform.select({
            ios: 'Nunito-Black',
            android: 'Nunito-Black',
        }),
        light: Platform.select({
            ios: 'Nunito-Light',
            android: 'Nunito-Light',
        }),
        extraLight: Platform.select({
            ios: 'Nunito-ExtraLight',
            android: 'Nunito-ExtraLight',
        }),
    },
} as const;
