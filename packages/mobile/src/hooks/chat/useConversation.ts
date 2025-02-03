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
  ConversationMetadata,
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
} from '@homebase-id/js-lib/core';
import { formatGuidId, getNewId, getNewXorId, stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { ChatConversationsReturn } from './useConversations';

import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { deleteAllChatMessages } from '../../provider/chat/ChatProvider';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { useErrors } from '../errors/useErrors';

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
  const identity = useDotYouClientContext().getLoggedInIdentity();
  const addErrors = useErrors().add;

  const createConversation = async ({
    recipients,
    title,
    image,
    distribute = false,
  }: {
    recipients: string[];
    title?: string;
    image?: ImageSource | undefined;
    distribute?: boolean;
  }) => {
    const newConversationId =
      recipients.length === 1
        ? await getNewXorId(identity as string, recipients[0])
        : formatGuidId(getNewId());

    if (recipients.length === 1) {
      const existingConversation = await getConversation(dotYouClient, newConversationId);
      if (existingConversation) return { ...existingConversation, newConversationId };
    }

    const updatedRecipients = [...new Set([...recipients, identity as string])];

    const newConversation: NewHomebaseFile<UnifiedConversation, ConversationMetadata> = {
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

    const uploadResult = await uploadConversation(dotYouClient, newConversation, distribute, image);
    if (!uploadResult) throw new Error('Failed to create the conversation');

    const serverVersion: HomebaseFile<UnifiedConversation, ConversationMetadata> = {
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
        originalAuthor: '',
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
    };

    return serverVersion;
  };

  const sendJoinCommand = async ({
    conversation,
  }: {
    conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>;
  }) => {
    return await uploadConversation(dotYouClient, conversation, true);
  };

  const updateExistingConversation = async ({
    conversation,
    distribute = false,
  }: {
    conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>;
    distribute?: boolean;
  }) => {
    if (distribute && conversation.fileMetadata.appData.content.recipients?.length >= 2) {
      return await updateConversation(dotYouClient, conversation, distribute);
    } else {
      return await updateConversation(dotYouClient, conversation);
    }
  };

  const clearChat = async ({
    conversation,
  }: {
    conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>;
  }) => {
    return await deleteAllChatMessages(
      dotYouClient,
      conversation.fileMetadata.appData.uniqueId as string
    );
  };

  const deleteChat = async ({
    conversation,
  }: {
    conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>;
  }) => {
    const deletedResult = await deleteAllChatMessages(
      dotYouClient,
      conversation.fileMetadata.appData.uniqueId as string
    );
    if (!deletedResult) throw new Error('Failed to delete chat messages');

    // We soft delete the conversation, so we can still see newly received messages
    const newConversation: HomebaseFile<UnifiedConversation, ConversationMetadata> = {
      ...conversation,
      fileMetadata: {
        ...conversation.fileMetadata,
        appData: { ...conversation.fileMetadata.appData, archivalStatus: 2 },
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
      onError: (error) => {
        addErrors(error, t('Failed to create the conversation'));
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
      onError: (error) => {
        addErrors(error, t('Failed to invite the recipient'));
      },
    }),
    update: useMutation({
      mutationFn: updateExistingConversation,
      onMutate: async (variables) => {
        queryClient.setQueryData<HomebaseFile<UnifiedConversation, ConversationMetadata>>(
          ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
          variables.conversation
        );
        const existingData = queryClient.getQueryData<InfiniteData<ChatConversationsReturn>>([
          'conversations',
        ]);
        if (existingData) {
          const newConversations = {
            ...existingData,
            pages: existingData.pages.map((page) => ({
              ...page,
              searchResults: page.searchResults.map((conversation) =>
                stringGuidsEqual(
                  conversation.fileMetadata.appData.uniqueId,
                  variables.conversation.fileMetadata.appData.uniqueId
                )
                  ? variables.conversation
                  : conversation
              ),
            })),
          };
          queryClient.setQueryData(['conversations'], newConversations);
        }
      },
      onError: (error) => {
        addErrors(error, t('Failed to update the conversation'));
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
      onError: (error) => {
        addErrors(error, t('Failed to clear the chat'));
      },
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
      onError: (error) => {
        addErrors(error, t('Failed to delete Chats'));
      },
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
      mutationFn: ({
        conversation,
      }: {
        conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>;
      }) => restoreChat(dotYouClient, conversation),
      onError: (error) => {
        addErrors(error, t('Failed to restore Chats'));
      },
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

export const restoreChat = async (
  dotYouClient: DotYouClient,
  conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>
) => {
  const newConversation: HomebaseFile<UnifiedConversation, ConversationMetadata> = {
    ...conversation,
    fileMetadata: {
      ...conversation.fileMetadata,
      appData: { ...conversation.fileMetadata.appData, archivalStatus: 0 },
    },
  };

  return await updateConversation(dotYouClient, newConversation);
};

const fetchSingleConversation = async (
  dotYouClient: DotYouClient,
  queryClient: QueryClient,
  conversationId: string
) => {
  const queryData = queryClient.getQueryData<
    InfiniteData<{
      searchResults: HomebaseFile<UnifiedConversation, ConversationMetadata>[];
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

  const conversationFromServer = await getSingleConversation(dotYouClient, conversationId);
  // Don't cache if the conversation is not found
  if (!conversationFromServer) throw new Error('Conversation not found');

  return conversationFromServer;
};

export const getConversationQueryOptions: (
  dotYouClient: DotYouClient,
  queryClient: QueryClient,
  conversationId: string | undefined
) => UndefinedInitialDataOptions<HomebaseFile<UnifiedConversation, ConversationMetadata> | null> = (
  dotYouClient,
  queryClient,
  conversationId
) => ({
  queryKey: ['conversation', conversationId],
  queryFn: () => fetchSingleConversation(dotYouClient, queryClient, conversationId as string),
  refetchOnMount: false,
  staleTime: 1000 * 60 * 5, // 5 minutes before updates to a conversation on another device are fetched on this one (when you were offline)
  enabled: !!conversationId,
  networkMode: 'offlineFirst', // We want to try the useConversations cache first
});
