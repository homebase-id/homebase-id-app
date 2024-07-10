import { DotYouClient } from '@youfoundation/js-lib/core';
import { stringifyToQueryParams } from '@youfoundation/js-lib/helpers';

export interface LinkMeta {
    title: string;
    description?: string;
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    url: string;
    type?: string;

}

export async function getUrlMetaData({ url, dotyouclient }: {
    url: string;
    dotyouclient: DotYouClient;
}): Promise<LinkMeta | undefined> {
    if (!url) {
        return;
    }
    const axiosclient = dotyouclient.createAxiosClient();
    const standardizedUrl = url.startsWith('http') ? url : `https://${url}`;
    try {
        const response = await axiosclient.get<LinkMeta>(`utils/links/extract?url=${standardizedUrl}`);
        return response.data;
    } catch (error) {
        console.log('error', error);
        throw error;

    }
}
