import { useQueryClient } from '@tanstack/react-query';
import { AppPermissionType } from '@homebase-id/js-lib/network';
import { t, useMissingPermissions } from 'homebase-id-app-common';
import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { TargetDriveAccessRequest } from '@homebase-id/js-lib/auth';

export const ExtendPermissionDialog = ({
  appId,
  appName,
  drives,
  circleDrives,
  permissions,
  needsAllConnected,
}: {
  appId: string;
  appName: string;
  drives: TargetDriveAccessRequest[];
  circleDrives?: TargetDriveAccessRequest[];
  permissions: AppPermissionType[];
  needsAllConnected?: boolean;
}) => {
  const queryClient = useQueryClient();
  const extendPermissionUrl = useMissingPermissions({
    appId,
    drives,
    circleDrives,
    permissions,
    needsAllConnected,
  });

  useEffect(() => {
    if (extendPermissionUrl) {
      queryClient.invalidateQueries({ queryKey: ['security-context'], exact: false });

      Alert.alert(
        t('Missing permissions'),
        t(
          `The ${appName} app is missing permissions. Without the necessary permissions the functionality of ${appName} will be limited`
        ),
        [
          {
            text: 'Extend permissions',
            onPress: async () => {
              if (await InAppBrowser.isAvailable()) {
                await InAppBrowser.open(extendPermissionUrl, {
                  enableUrlBarHiding: false,
                  enableDefaultShare: false,
                });
              } else Linking.openURL(extendPermissionUrl);
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
  }, [appName, extendPermissionUrl, queryClient]);

  return null;
};
