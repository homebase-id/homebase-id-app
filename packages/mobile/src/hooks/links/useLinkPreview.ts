import { useQuery } from '@tanstack/react-query';
import { getUrlMetaData, LinkMeta } from '../../provider/chat/LinkProvider';
import { useDotYouClientContext } from 'feed-app-common';
import { Image } from 'react-native';



export const useLinkPreview = (url: string | undefined) => {
    const dotyouclient = useDotYouClientContext();
    async function fetchLinkData(): Promise<LinkMeta | undefined> {
        if (!url) {
            return;
        }
        const linkMeta: LinkMeta | undefined = await getUrlMetaData({ url, dotyouclient });
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
            staleTime: Infinity,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
        }),
    };
};
