import { getDriveStatus, TargetDrive } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
import { useQuery } from '@tanstack/react-query';

export const useDrive = (drive: TargetDrive) => {
    const dotyouClient = useDotYouClientContext();
    async function fetchStatus(drive: TargetDrive) {
        return await getDriveStatus(dotyouClient, drive);
    }

    return {
        getStatus: useQuery({
            queryKey: ['drive-status', `${drive?.alias}_${drive?.type}`],
            queryFn: () => fetchStatus(drive as TargetDrive),
            enabled: !!drive,
            refetchOnWindowFocus: true,
        }),
    };


};
