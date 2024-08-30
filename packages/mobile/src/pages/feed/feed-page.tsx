import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from '../../components/ui/SafeAreaView/SafeAreaView';
import { Keyboard, TouchableOpacity } from 'react-native';
import { Colors } from '../../app/Colors';
import { useRemoveNotifications } from '../../hooks/notifications/usePushNotifications';
import { FEED_APP_ID } from '../../app/constants';
import { Plus } from '../../components/ui/Icons/icons';
import { useIsFocused } from '@react-navigation/native';
import SocialFeedMainContent from '../../components/Feed/MainContent/SocialFeed';
import { FeedStackParamList } from '../../app/FeedStack';

type FeedProps = NativeStackScreenProps<FeedStackParamList, 'Home'>;

export const FeedPage = memo(({ navigation }: FeedProps) => {
  const isFocused = useIsFocused();
  useRemoveNotifications({ disabled: !isFocused, appId: FEED_APP_ID });

  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaView>
      {/* <SocialFeedWebView /> */}
      <SocialFeedMainContent />

      {!keyboardVisible && (
        <TouchableOpacity
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: Colors.indigo[500],
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            bottom: 20,
            right: 20,
          }}
          onPress={() => navigation.navigate('Compose')}
        >
          <Plus color={Colors.white} size="lg" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
});
