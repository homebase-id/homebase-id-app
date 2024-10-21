import { HomebaseFile } from '@homebase-id/js-lib/core';
import { PostContent } from '@homebase-id/js-lib/public';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useChannels } from './channels/useChannels';
import { getPostQueryOptions } from './post/usePost';
import { useDotYouClientContext } from 'homebase-id-app-common';

export const useReferencedPost = (postKey: string | undefined) => {
    const [post, setPost] = useState<HomebaseFile<PostContent> | null>(null);
    const dotYouClient = useDotYouClientContext();
    const queryClient = useQueryClient();
    const { data: allChannels } = useChannels({ isOwner: true, isAuthenticated: true });
    useEffect(() => {
        if (!postKey || !allChannels) return;

        (async () => {
            allChannels?.forEach(async (channel) => {
                const post = await queryClient.fetchQuery(
                    getPostQueryOptions(dotYouClient, queryClient, undefined, channel, postKey)
                );
                if (post) {
                    setPost(post);
                }
            });
        })();
    }, [allChannels, dotYouClient, postKey, queryClient]);

    return post;
};
