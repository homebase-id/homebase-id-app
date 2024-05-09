import { useNetInfo } from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { focusManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';

export const useRefetchOnFocus = () => {
  const firstTimeRef = useRef(true);

  // Alternative focus effect for React-Native
  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      focusManager.setFocused(true);
    }, [])
  );

  // Listen to app state changes
  const queryClient = useQueryClient();
  const appState = useRef(AppState.currentState);
  const netinfo = useNetInfo();
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        netinfo.isConnected // Only refetch if we're online
      ) {
        //Refetch stale queries
        queryClient.refetchQueries({ stale: true });
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  });
};
