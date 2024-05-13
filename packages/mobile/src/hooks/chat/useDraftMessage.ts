import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useDraftMessage = (conversationId: string | undefined) => {
    const queryClient = useQueryClient();

    const getDraftMessage = useCallback(async (): Promise<string> => {
        return await AsyncStorage.getItem(`draft-${conversationId}`) || '';
    }
        , [conversationId]);

    async function setDraftMessage(message: string): Promise<void> {
        await AsyncStorage.setItem(`draft-${conversationId}`, message);
    }
    return {
        set: useMutation({
            mutationKey: ['draft', conversationId],
            mutationFn: setDraftMessage,
            gcTime: 0,
            onSettled: () => {
                queryClient.invalidateQueries({ queryKey: ['draft', conversationId] });
            },
        }),
        getDraftMessage,

    };
};

export const useDraftMessageValue = (conversationId: string | undefined) => {
    const getDraftMessage = useCallback(async (): Promise<string> => {
        return await AsyncStorage.getItem(`draft-${conversationId}`) || '';
    }
        , [conversationId]);
    return {
        get: useQuery({
            queryKey: ['draft', conversationId],
            queryFn: getDraftMessage,
            enabled: !!conversationId,
            staleTime: 0,
            gcTime: 0,
        }),
    };
};

