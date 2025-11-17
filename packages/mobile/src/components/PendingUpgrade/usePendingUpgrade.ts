import { useQuery } from '@tanstack/react-query';
import { useDotYouClientContext } from 'homebase-id-app-common';

export const usePendingUpgrade = () => {
    const dotYouClient = useDotYouClientContext();
    return useQuery({
        queryKey: ['pending-upgrade'],
        // staleTime: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: 0,
        refetchOnReconnect: false,
        refetchOnWindowFocus: true,
        refetchOnMount: false,
        queryFn: async () => {
            const client = dotYouClient.createAxiosClient();
            const response = await client.get('/auth/verifytoken');
            console.log('Pending upgrade check response headers:', response.headers);
            return !!response.headers['X-REQUIRES-UPGRADE'] || !!response.headers['x-requires-upgrade'];
        },
    });
};
