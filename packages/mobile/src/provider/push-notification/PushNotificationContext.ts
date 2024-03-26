import { createContext, useContext } from 'react';

interface PushNotificationContextType {
  notificationPermissionGranted: boolean;
  setNotificationPermissionGranted: (permissionGranted: boolean) => void;
}

export const PushNotificationPermissionContext = createContext<
  PushNotificationContextType | undefined
>(undefined);

export const usePushNotificationPermission = (): PushNotificationContextType => {
  const context = useContext(PushNotificationPermissionContext);
  if (!context) {
    throw new Error('usePushNotificationPermission must be used within a PushNotificationProvider');
  }
  return context;
};
