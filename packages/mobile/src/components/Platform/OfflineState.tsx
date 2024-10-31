import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../app/Colors';
import { t } from 'homebase-id-app-common';
import { onlineManager } from '@tanstack/react-query';
import { fetch } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import Animated, { SlideInDown, SlideOutUp } from 'react-native-reanimated';

export const OfflineState = ({ isConnected }: { isConnected?: boolean | null }) => {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());

  const isConnecting = isConnected === false;

  useEffect(() => {
    onlineManager.subscribe((online) => setIsOnline(online));
  }, [setIsOnline]);

  if (!isOnline) return <NoInternetState />;
  if (isConnecting) return <ConnectingState />;

  return null;
};

const ConnectingState = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <View style={isDarkMode ? connectingStyles.darkContainer : connectingStyles.container}>
      <Text style={isDarkMode ? connectingStyles.darkText : connectingStyles.text}>
        {t('Connecting...')}
      </Text>
    </View>
  );
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const NoInternetState = () => {
  return (
    <AnimatedTouchableOpacity
      entering={SlideInDown.withInitialValues({
        originY: -100,
      })}
      exiting={SlideOutUp.duration(200)}
      onPress={() => {
        fetch().then((state) => {
          // When in doubt set online
          onlineManager.setOnline(!!state.isConnected);
        });
      }}
    >
      <View style={noInternetStyles.container}>
        <Text style={noInternetStyles.text}>{t('No internet connection')}</Text>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const connectingStyles = {
  container: {
    backgroundColor: Colors.slate[200],
    padding: 10,
  },
  darkContainer: {
    backgroundColor: Colors.slate[700],
    padding: 10,
  },
  text: {
    color: Colors.black,
  },
  darkText: {
    color: Colors.white,
  },
};

const noInternetStyles = {
  container: {
    backgroundColor: Colors.red[500],
    padding: 10,
  },
  text: {
    color: Colors.white,
  },
};
