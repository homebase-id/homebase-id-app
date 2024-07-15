import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { ChatStackParamList } from '../../app/ChatStack';
import ShareMenu from 'react-native-share-menu';

const { RNShareIntent } = NativeModules;

const NEW_SHARE_EVENT_NAME = 'NewShareEvent';

const EventEmitter = Platform.OS === 'android' ? new NativeEventEmitter(RNShareIntent) : undefined;

export type SharedItem = {
  mimeType: string;
  data: string;
  extraData?: object;
};

export const useShareManager = () => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  const handleShare = useCallback(
    (item?: SharedItem) => {
      console.log('Shared item:', item);
      if (!item) {
        return;
      }
      navigation.navigate('ShareChat', item);
    },
    [navigation]
  );

  const handleInitialShare = useCallback(() => {
    if (Platform.OS === 'ios') {
      // Ios not supported yet
      ShareMenu.getInitialShare((s: any) => handleShare(s?.data));
      return;
    }
    RNShareIntent.getSharedText(handleShare);
  }, [handleShare]);

  useFocusEffect(handleInitialShare);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Ios not supported yet
      return;
    } else {
      EventEmitter?.addListener(NEW_SHARE_EVENT_NAME, handleShare);

      return () => {
        EventEmitter?.removeAllListeners(NEW_SHARE_EVENT_NAME);
      };
    }
  }, [handleShare]);
};
