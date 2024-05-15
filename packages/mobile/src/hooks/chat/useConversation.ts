import {
  InfiniteData,
  QueryClient,
  UndefinedInitialDataOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  CHAT_CONVERSATION_FILE_TYPE,
  UnifiedConversation,
  getConversation,
  updateConversation,
  uploadConversation,
} from '../../provider/chat/ConversationProvider';
import {
  DotYouClient,
  EncryptedKeyHeader,
  HomebaseFile,
  NewHomebaseFile,
  SecurityGroupType,
} from '@youfoundation/js-lib/core';
import { getNewId, getNewXorId, stringGuidsEqual } from '@youfoundation/js-lib/helpers';
import { useConversations } from './useConversations';

import { useDotYouClientContext } from 'feed-app-common';
import { deleteAllChatMessages } from '../../provider/chat/ChatProvider';

export const getSingleConversation = async (
  dotYouClient: DotYouClient,
  conversationId: string | undefined
) => {
  return conversationId ? await getConversation(dotYouClient, conversationId) : null;
};

export const useConversation = (props?: { conversationId?: string | undefined }) => {
  const { conversationId } = props || {};
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();
  const identity = useDotYouClientContext().getIdentity();

  // Already get the conversations in the cache, so we can use that on `getExistingConversationsForRecipient`
  useConversations().all;

  const getExistingConversationsForRecipient = async (
    recipients: string[]
  ): Promise<null | HomebaseFile<UnifiedConversation>> => {
    const allConversationsInCache = await queryClient.fetchInfiniteQuery<{
      searchResults: HomebaseFile<UnifiedConversation>[];
    }>({ queryKey: ['conversations'], initialPageParam: undefined });

    const filteredRecipients = recipients.filter((id) => id !== identity);

    for (const page of allConversationsInCache?.pages || []) {
      const matchedConversation = page.searchResults.find((conversation) => {
        const conversationContent = conversation.fileMetadata.appData.content;
        const conversationRecipients = conversationContent.recipients.filter(
          (id) => id !== identity
        );

        return (
          conversationRecipients.length === filteredRecipients.length &&
          conversationRecipients.every((recipient) => filteredRecipients.includes(recipient))
        );
      });
      if (matchedConversation) return matchedConversation;
    }

    return null;
  };

  const createConversation = async ({
    recipients,
    title,
  }: {
    recipients: string[];
    title?: string;
  }) => {
    // Check if there is already a conversations with this recipient.. If so.. Don't create a new one
    const existingConversation = await getExistingConversationsForRecipient(recipients);
    if (existingConversation) {
      return existingConversation;
    }

    const newConversationId =
      recipients.length === 1 ? await getNewXorId(identity as string, recipients[0]) : getNewId();

    const updatedRecipients = [...new Set([...recipients, identity as string])];

    const newConversation: NewHomebaseFile<UnifiedConversation> = {
      fileMetadata: {
        appData: {
          uniqueId: newConversationId,
          content: {
            recipients: updatedRecipients,
            title: title || recipients.join(', '),
          },
        },
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Owner,
        },
      },
    };

    const uploadResult = await uploadConversation(dotYouClient, newConversation);
    if (!uploadResult) throw new Error('Failed to create the conversation');

    const serverVersion: HomebaseFile<UnifiedConversation> = {
      ...newConversation,
      fileId: uploadResult.file.fileId,
      fileState: 'active',
      fileSystemType: 'Standard',
      fileMetadata: {
        ...newConversation.fileMetadata,
        created: Date.now(),
        updated: Date.now(),
        isEncrypted: true,
        senderOdinId: '',
        appData: {
          ...newConversation.fileMetadata.appData,
          fileType: CHAT_CONVERSATION_FILE_TYPE,
          dataType: 0,
        },
        versionTag: uploadResult.newVersionTag,
        payloads: [],
      },
      sharedSecretEncryptedKeyHeader: {} as EncryptedKeyHeader,
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Owner,
        },
        doNotIndex: false,
        allowDistribution: false,
      },
      priority: 0,
    };

    return serverVersion;
  };

  const sendJoinCommand = async ({
    conversation,
  }: {
    conversation: HomebaseFile<UnifiedConversation>;
  }) => {
    conversation.fileMetadata.appData.content.lastReadTime = 0;
    return await uploadConversation(dotYouClient, conversation, true);
  };

  const updateExistingConversation = async ({
    conversation,
    isTitleUpdated = false,
  }: {
    conversation: HomebaseFile<UnifiedConversation>;
    isTitleUpdated?: boolean;
  }) => {
    await updateConversation(dotYouClient, conversation);
    conversation.fileMetadata.appData.content.lastReadTime = 0;
    if (isTitleUpdated && 'recipients' in conversation.fileMetadata.appData.content) {
      conversation.fileMetadata.appData.content.lastReadTime = 0;
      await uploadConversation(dotYouClient, conversation, true);
    }
  };

  const clearChat = async ({
    conversation,
  }: {
    conversation: HomebaseFile<UnifiedConversation>;
  }) => {
    return await deleteAllChatMessages(
      dotYouClient,
      conversation.fileMetadata.appData.uniqueId as string
    );
  };

  const deleteChat = async ({
    conversation,
  }: {
    conversation: HomebaseFile<UnifiedConversation>;
  }) => {
    const deletedResult = await deleteAllChatMessages(
      dotYouClient,
      conversation.fileMetadata.appData.uniqueId as string
    );
    if (!deletedResult) throw new Error('Failed to delete chat messages');

    // We soft delete the conversation, so we can still see newly received messages
    const newConversation: HomebaseFile<UnifiedConversation> = {
      ...conversation,
      fileMetadata: {
        ...conversation.fileMetadata,
        appData: { ...conversation.fileMetadata.appData, archivalStatus: 2 },
      },
    };

    return await updateConversation(dotYouClient, newConversation);
  };

  const restoreChat = async ({
    conversation,
  }: {
    conversation: HomebaseFile<UnifiedConversation>;
  }) => {
    const newConversation: HomebaseFile<UnifiedConversation> = {
      ...conversation,
      fileMetadata: {
        ...conversation.fileMetadata,
        appData: { ...conversation.fileMetadata.appData, archivalStatus: 0 },
      },
    };

    return await updateConversation(dotYouClient, newConversation);
  };

  return {
    single: useQuery(getConversationQueryOptions(dotYouClient, queryClient, conversationId)),
    create: useMutation({
      mutationFn: createConversation,
      onSettled: async (_data) => {
        queryClient.invalidateQueries({
          queryKey: ['conversation', _data?.fileMetadata.appData.uniqueId],
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      },
    }),
    inviteRecipient: useMutation({
      mutationFn: sendJoinCommand,
      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      },
    }),
    update: useMutation({
      mutationFn: updateExistingConversation,
      onMutate: async (variables) => {
        queryClient.setQueryData<HomebaseFile<UnifiedConversation>>(
          ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
          variables.conversation
        );
      },
      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({
          queryKey: ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
        });
      },
    }),
    clearChat: useMutation({
      mutationFn: clearChat,

      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
        });
        queryClient.invalidateQueries({
          queryKey: ['chat-messages', variables.conversation.fileMetadata.appData.uniqueId],
        });
      },
    }),
    deleteChat: useMutation({
      mutationFn: deleteChat,

      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['conversations'],
        });
        queryClient.invalidateQueries({
          queryKey: ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
        });
        queryClient.invalidateQueries({
          queryKey: ['chat-messages', variables.conversation.fileMetadata.appData.uniqueId],
        });
      },
    }),
    restoreChat: useMutation({
      mutationFn: restoreChat,

      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['conversations'],
        });
        queryClient.invalidateQueries({
          queryKey: ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
        });
        queryClient.invalidateQueries({
          queryKey: ['chat-messages', variables.conversation.fileMetadata.appData.uniqueId],
        });
      },
    }),
  };
};

const fetchSingleConversation = async (
  dotYouClient: DotYouClient,
  queryClient: QueryClient,
  conversationId: string
) => {
  const queryData = queryClient.getQueryData<
    InfiniteData<{
      searchResults: HomebaseFile<UnifiedConversation>[];
      cursorState: string;
      queryTime: number;
      includeMetadataHeader: boolean;
    }>
  >(['conversations']);

  const conversationFromCache = queryData?.pages
    .flatMap((page) => page.searchResults)
    .find((conversation) =>
      stringGuidsEqual(conversation.fileMetadata.appData.uniqueId, conversationId)
    );
  if (conversationFromCache) return conversationFromCache;

  return await getSingleConversation(dotYouClient, conversationId);
};

export const getConversationQueryOptions: (
  dotYouClient: DotYouClient,
  queryClient: QueryClient,
  conversationId: string | undefined
) => UndefinedInitialDataOptions<HomebaseFile<UnifiedConversation> | null> = (
  dotYouClient,
  queryClient,
  conversationId
) => ({
  queryKey: ['conversation', conversationId],
  queryFn: () => fetchSingleConversation(dotYouClient, queryClient, conversationId as string),
  refetchOnMount: false,
  staleTime: 1000 * 60 * 60, // 1 hour
  enabled: !!conversationId,
});
