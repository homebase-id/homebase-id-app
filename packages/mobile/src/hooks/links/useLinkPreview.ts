import { useQuery } from '@tanstack/react-query';
import { getLinkPreview, LinkPreview } from '../../provider/chat/LinkProvider';
import { useDotYouClientContext } from 'feed-app-common';
import { Image } from 'react-native';
import { getPayloadAsJson, TargetDrive } from '@youfoundation/js-lib/core';



export const useLinkPreview = (url: string | undefined) => {
    const dotyouclient = useDotYouClientContext();
    async function fetchLinkData(): Promise<LinkPreview | null> {
        if (!url) {
            return null;
        }
        const linkMeta: LinkPreview | null = await getLinkPreview(dotyouclient, url);
        if (linkMeta && linkMeta?.imageUrl && (!linkMeta?.imageHeight || !linkMeta?.imageWidth)) {
            await Image.getSize(linkMeta.imageUrl, (width, height) => {
                linkMeta.imageHeight = height;
                linkMeta.imageWidth = width;
            });
        }
        return linkMeta;
    }

    return {
        get: useQuery({
            queryKey: ['ogp', url],
            enabled: !!url,
            queryFn: fetchLinkData,
            staleTime: 2000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
        }),
    };
};

export const useLinkMetadata = ({
    targetDrive,
    fileId,
    payloadKey,
}: {
    targetDrive: TargetDrive;
    fileId: string;
    payloadKey: string;
}) => {
    const dotYouClient = useDotYouClientContext();

    return useQuery({
        queryKey: ['link-metadata', targetDrive.alias, fileId, payloadKey],
        queryFn: async () =>
            getPayloadAsJson<LinkPreview[]>(dotYouClient, targetDrive, fileId, payloadKey),
    });
};
