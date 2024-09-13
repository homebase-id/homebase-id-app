import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { ChatStackParamList } from '../../app/ChatStack';
import Toast from 'react-native-toast-message';


const { ShareMenu } = NativeModules;

const NEW_SHARE_EVENT_NAME = 'NewShareEvent';

const EventEmitter = new NativeEventEmitter(ShareMenu);

export type SharedItem = {
  mimeType: string;
  data: string | string[];
  extraData?: object;
};

export const useShareManager = () => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  const handleShare = useCallback(
    (item?: SharedItem) => {
      console.log('item', item);
      if (!item) {
        return;
      }
      if (item.mimeType === '*/*') {
        // Wildcard mimetypes aren't supported
        Toast.show({
          type: 'info',
          text1: 'Unknown mime type',
        });
        return;
      }
      navigation.navigate('ShareChat', item);
    },
    [navigation]
  );

  const handleInitialShare = useCallback(() => {
    ShareMenu.getSharedText(handleShare);
  }, [handleShare]);

  useFocusEffect(handleInitialShare);

  useEffect(() => {

    EventEmitter?.addListener(NEW_SHARE_EVENT_NAME, handleShare);
    return () => {
      EventEmitter?.removeAllListeners(NEW_SHARE_EVENT_NAME);
    };

  }, [handleShare]);
};
