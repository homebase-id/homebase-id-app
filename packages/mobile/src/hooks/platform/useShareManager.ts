import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { ChatStackParamList } from '../../app/ChatStack';


const { ShareMenu } = NativeModules;

const NEW_SHARE_EVENT_NAME = 'NewShareEvent';

const EventEmitter = new NativeEventEmitter(ShareMenu);

export type SharedItem = {
  mimeType: string;
  data: string;
  extraData?: object;
};

export const useShareManager = () => {
  const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
  const handleShare = useCallback(
    (item?: SharedItem) => {
      console.log('handleShare', item);
      if (!item) {
        return;
      }
      navigation.navigate('ShareChat', item);
    },
    [navigation]
  );

  const handleInitialShare = useCallback(() => {
    ShareMenu.getSharedText((data: any) => {
      console.log('ShareItemData', data);
      return handleShare(data);
    });
  }, [handleShare]);

  useFocusEffect(handleInitialShare);

  useEffect(() => {

    EventEmitter?.addListener(NEW_SHARE_EVENT_NAME, (s) => {
      console.log('NEW_SHARE_EVENT_NAME', s);
      return handleShare(s);
    });
    return () => {
      EventEmitter?.removeAllListeners(NEW_SHARE_EVENT_NAME);
    };

  }, [handleShare]);
};
