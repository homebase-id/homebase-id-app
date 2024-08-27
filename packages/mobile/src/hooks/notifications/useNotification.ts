import { PushNotification } from '@homebase-id/js-lib/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useNotification = () => {
    const queryClient = useQueryClient();

    return {
        fetch: useQuery({
            queryKey: ['notifications'],
            queryFn: () => [] as PushNotification[],
            gcTime: Infinity,
            staleTime: Infinity,
        }),
        add: (notification: PushNotification) => {
            const currentNotifications = queryClient.getQueryData<PushNotification[]>(['notifications']);
            // If notification is already in the list, don't add it again
            if (currentNotifications?.find((n) => n === notification)) {
                return;
            }
            const updatedNotifications = [...(currentNotifications || []), notification];
            queryClient.setQueryData(['notifications'], updatedNotifications);
        },
        dismiss: (notification: PushNotification) => {
            const currentNotifications = queryClient.getQueryData<PushNotification[]>(['notifications']);
            const updatedNotifications = currentNotifications?.filter((n) => n !== notification);
            queryClient.setQueryData(['notifications'], updatedNotifications);
        },
    };

};
