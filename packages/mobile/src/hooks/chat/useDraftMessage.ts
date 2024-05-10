import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useDraftMessage = (conversationId: string | undefined) => {
    const queryClient = useQueryClient();

    async function getDraftMessage(): Promise<string> {
        return await AsyncStorage.getItem(`draft-${conversationId}`) || '';
    }

    async function setDraftMessage(message: string): Promise<void> {
        await AsyncStorage.setItem(`draft-${conversationId}`, message);
    }

    return {
        get: useQuery({
            queryKey: ['draft', conversationId],
            queryFn: getDraftMessage,
            enabled: !!conversationId,
            staleTime: 0,
            gcTime: 0,
        }),
        set: useMutation({
            mutationKey: ['draft', conversationId],
            mutationFn: setDraftMessage,
            gcTime: 0,
            onSettled: () => {
                queryClient.invalidateQueries({ queryKey: ['draft', conversationId] });
            },
        }),

    };
};
