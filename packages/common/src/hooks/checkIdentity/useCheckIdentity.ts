import { ApiType, DotYouClient } from "@youfoundation/js-lib/core";
import { getDomainFromUrl } from "@youfoundation/js-lib/helpers";
import { useQuery } from '@tanstack/react-query';

export const useCheckIdentity = (odinId?: string) => {
    const doCheckIdentity = async (odinId?: string) => {
        if (!odinId) return false;
        const strippedIdentity = getDomainFromUrl(odinId)?.toLowerCase();

        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]{2,25}(?::\d{1,5})?$/i;
        const isValid = domainRegex.test(strippedIdentity || '');
        if (!isValid) return false;

        const dotYouClient = new DotYouClient({ api: ApiType.Guest, identity: strippedIdentity });
        return await fetch(`${dotYouClient.getEndpoint()}/auth/ident`)
            .then((response) => {
                if (response.status !== 200) return;
                return response.json();
            })
            .then((validation) => validation?.odinId.toLowerCase() === strippedIdentity)
            .catch(() => false);
    };

    return useQuery({
        queryKey: ['check-identity', odinId],
        queryFn: () => doCheckIdentity(odinId),
        staleTime: 1000 * 60 * 60,
    });
};
