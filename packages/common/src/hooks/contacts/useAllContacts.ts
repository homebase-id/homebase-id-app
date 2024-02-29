import { ContactFile, getContacts } from '@youfoundation/js-lib/network';

import { useQuery } from '@tanstack/react-query';
import { DriveSearchResult } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from '../auth/useDotYouClientContext';

const CHUNKSIZE = 200;
export const useAllContacts = (enabled: boolean) => {
    const dotYouClient = useDotYouClientContext();

    const fetchMentionTargets = async () => {
        // self invoking function that fetches the contacts in blocks of a CHUNKSIZE untill there are no more contacts to fetch
        const internalGetContacts = async (
            cursor: string | undefined,
            limit: number
        ): Promise<DriveSearchResult<ContactFile>[]> => {
            const contacts = await getContacts(dotYouClient, cursor, limit);
            if (contacts?.cursorState && contacts.results.length >= limit) {
                const nextContacts = await internalGetContacts(contacts.cursorState, limit);
                return contacts.results.concat(nextContacts);
            }
            return contacts.results;
        };

        return internalGetContacts(undefined, CHUNKSIZE);
    };

    return useQuery({
        queryKey: ['mention-targets'],
        queryFn: fetchMentionTargets,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        gcTime: Infinity,
        staleTime: Infinity,
        enabled,
    });
};
