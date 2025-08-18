import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { AuthStackParamList } from '../../app/App';
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
  // This hook runs at the app root (inside AppStackScreen), so the nearest navigator is the Tab stack.
  // We must navigate to the nested Chat stack to reach ShareChat.
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
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
      navigation.navigate('Authenticated', { screen: 'Chat', params: { screen: 'ShareChat', params: item } });
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
