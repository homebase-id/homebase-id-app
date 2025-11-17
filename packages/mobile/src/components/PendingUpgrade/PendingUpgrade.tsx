import { useQueryClient } from '@tanstack/react-query';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { useEffect, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { usePendingUpgrade } from './usePendingUpgrade';

export const PendingUpgradeDialog = () => {
  const dotYouClient = useDotYouClientContext();
  const { data: hasPendingUpgrade } = usePendingUpgrade();
  const queryClient = useQueryClient();

  const upgradeUrl = useMemo(
    () => `${dotYouClient.getRoot()}/owner/settings/version-info`,
    [dotYouClient]
  );

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
              setTimeout(async () => {
                await queryClient.invalidateQueries({ queryKey: ['pending-upgrade'] });
              }, 60 * 1000); // invalidate after 1 minute
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
  }, [hasPendingUpgrade, queryClient, upgradeUrl]);

  return null;
};
