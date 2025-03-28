import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { ChatStackParamList } from '../../app/ChatStack';
import { addLogs } from '../../provider/log/logger';


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
    (item?: SharedItem[]) => {
      if (!item) {
        return;
      }
      addLogs({
        message: 'useShareManager: handleShare',
        type: 'warning',
        title: 'useShareManager',
        details: {
          stackTrace: JSON.stringify(item, null, 2),
        },
      });
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
