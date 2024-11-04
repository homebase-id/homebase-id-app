import { useQuery } from '@tanstack/react-query';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { useEffect, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';

export const PendingUpgradeDialog = () => {
  const dotYouClient = useDotYouClientContext();
  const { data: hasPendingUpgrade } = usePendingUpgrade();

  const upgradeUrl = useMemo(() => `${dotYouClient.getRoot()}/owner`, [dotYouClient]);

  useEffect(() => {
    if (hasPendingUpgrade) {
      Alert.alert(
        t('Data upgrade required'),
        t(
          'Your identity has a pending upgrade. Please head to your owner console to run the automated upgrade process'
        ),
        [
          {
            text: 'Upgrade now',
            onPress: async () => {
              if (await InAppBrowser.isAvailable()) {
                await InAppBrowser.open(upgradeUrl, {
                  enableUrlBarHiding: false,
                  enableDefaultShare: false,
                });
              } else Linking.openURL(upgradeUrl);
            },
          },
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
        ]
      );
    }
  }, [hasPendingUpgrade, upgradeUrl]);

  return null;
};

const usePendingUpgrade = () => {
  const dotYouClient = useDotYouClientContext();

  return useQuery({
    queryKey: ['pending-upgrade'],
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const client = dotYouClient.createAxiosClient();
      const response = await client.get('/auth/verifytoken');
      return !!response.headers['X-REQUIRES-UPGRADE'];
    },
  });
};
