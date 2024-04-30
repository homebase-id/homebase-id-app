import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { ChatStackParamList } from '../../app/App';

const { RNShareIntent } = NativeModules;

const NEW_SHARE_EVENT_NAME = 'NewShareEvent';

const EventEmitter = new NativeEventEmitter(RNShareIntent);

export type SharedItem = {
    mimeType: string,
    data: string,
    extraData?: object,
};


export const useShareManager = () => {

    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const handleShare = useCallback((item?: SharedItem) => {
        if (!item) {
            return;
        }
        navigation.navigate('ShareChat', item);
    }, [navigation]);

    useEffect(() => {
        if (Platform.OS === 'ios') {
            // Ios not supported yet
            return;
        }
        RNShareIntent.getSharedText(handleShare);
    }, [handleShare]);


    useEffect(() => {
        if (Platform.OS === 'ios') {
            // Ios not supported yet
            return;
        }
        EventEmitter.addListener(NEW_SHARE_EVENT_NAME, handleShare);

        return () => {
            EventEmitter.removeAllListeners(NEW_SHARE_EVENT_NAME);
        };
    }, [handleShare]);



};



