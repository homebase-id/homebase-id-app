import { useQuery } from '@tanstack/react-query';

const OGP_PARSER_URL = 'https://ogpparser.bishwajeetparhi.dev';

export type LinkPreviewMeta = {
    title: string;
    description?: string;
    image?: {
        url: string;
        width?: number;
        height?: number;
        alt?: string;
    }
}

export const useLinkPreview = (url: string | undefined) => {
    async function fetchLinkData(): Promise<LinkPreviewMeta | undefined> {
        try {
            console.log('Fetching link data for', url);
            const response = await fetch(`${OGP_PARSER_URL}/?url=${url?.trim()}`).catch((error) => {
                console.error('Error fetching link data', error);
                throw new Error('Error fetching link data');
            });
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            if (data) {
                return {
                    title: data.title,
                    description: data.description,
                    image: {
                        url: data.og['og:image'],
                        width: data.og['og:image:width'],
                        height: data.og['og:image:height'],
                        alt: data.og['og:image:alt'],
                    },
                };
            }

        } catch (error) {
            throw new Error('Something went wrong');
        }
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
