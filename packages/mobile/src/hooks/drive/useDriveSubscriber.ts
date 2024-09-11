import { getDrivesByType } from '@homebase-id/js-lib/core';
import { BlogConfig } from '@homebase-id/js-lib/public';
import { useQuery } from '@tanstack/react-query';
import { useDotYouClientContext } from 'feed-app-common';
import { ChatDrive } from '../../provider/chat/ConversationProvider';

const PAGE_SIZE = 100;

export const useDriveSubscriber = () => {
    const dotyouClient = useDotYouClientContext();
    const fetchPostsDrives = async () => {
        const pagedDrives = await getDrivesByType(dotyouClient, BlogConfig.DriveType, 1, PAGE_SIZE);
        return pagedDrives.results.map((drive) => drive.targetDriveInfo);
    };
    return useQuery({
        queryKey: ['drive-subscriber'],
        select: (data) => [ChatDrive, BlogConfig.FeedDrive, BlogConfig.PublicChannelDrive, ...data],
        queryFn: fetchPostsDrives,
        refetchOnMount: false,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 60,
    });
};
