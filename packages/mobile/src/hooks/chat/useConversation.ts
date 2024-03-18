import { useMutation, useQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import {
  Conversation,
  GroupConversation,
  SingleConversation,
  getConversation,
  requestConversationCommand,
  updateConversation,
  updateGroupConversationCommand,
  uploadConversation,
} from '../../provider/chat/ConversationProvider';
import {
  DotYouClient,
  DriveSearchResult,
  NewDriveSearchResult,
  SecurityGroupType,
} from '@youfoundation/js-lib/core';
import { getNewId, getNewXorId } from '@youfoundation/js-lib/helpers';
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
  ): Promise<null | DriveSearchResult<Conversation>> => {
    const allConversationsInCache = await queryClient.fetchQuery<
      InfiniteData<{ searchResults: DriveSearchResult<Conversation>[] }>
    >({ queryKey: ['conversations'] });

    for (const page of allConversationsInCache?.pages || []) {
      const matchedConversation = page.searchResults.find((conversation) => {
        const conversationContent = conversation.fileMetadata.appData.content;
        const conversationRecipients = (conversationContent as GroupConversation).recipients || [
          (conversationContent as SingleConversation).recipient,
        ];

        return (
          conversationRecipients.length === recipients.length &&
          conversationRecipients.every((recipient) => recipients.includes(recipient))
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
      return {
        ...existingConversation,
        newConversationId: existingConversation.fileMetadata.appData.uniqueId as string,
      };
    }

    const newConversationId =
      recipients.length === 1 ? await getNewXorId(identity as string, recipients[0]) : getNewId();

    const newConversation: NewDriveSearchResult<Conversation> = {
      fileMetadata: {
        appData: {
          uniqueId: newConversationId,
          content: {
            ...(recipients.length > 1
              ? {
                recipients: recipients,
              }
              : {
                recipient: recipients[0],
              }),
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

    const uploadResult = {
      newConversationId,
      ...(await uploadConversation(dotYouClient, newConversation)),
    };

    return uploadResult;
  };

  const sendJoinCommand = async ({
    conversation,
  }: {
    conversation: DriveSearchResult<Conversation>;
  }): Promise<void> => {
    await requestConversationCommand(
      dotYouClient,
      conversation.fileMetadata.appData.content,
      conversation.fileMetadata.appData.uniqueId as string
    );
  };

  const updateExistingConversation = async ({
    conversation,
    isTitleUpdated = false,
  }: {
    conversation: DriveSearchResult<Conversation>;
    isTitleUpdated?: boolean;
  }) => {
    return await updateConversation(dotYouClient, conversation).then(async () => {
      if (isTitleUpdated && 'recipients' in conversation.fileMetadata.appData.content) {
        await updateGroupConversationCommand(
          dotYouClient,
          conversation.fileMetadata.appData.content as GroupConversation,
          conversation.fileMetadata.appData.uniqueId as string
        );
      }
    });

  };

  const clearChat = async ({ conversation }: { conversation: DriveSearchResult<Conversation> }) => {
    return await deleteAllChatMessages(
      dotYouClient,
      conversation.fileMetadata.appData.uniqueId as string
    );
  };

  const deleteChat = async ({
    conversation,
  }: {
    conversation: DriveSearchResult<Conversation>;
  }) => {
    const deletedResult = await deleteAllChatMessages(
      dotYouClient,
      conversation.fileMetadata.appData.uniqueId as string
    );
    if (!deletedResult) throw new Error('Failed to delete chat messages');

    // We soft delete the conversation, so we can still see newly received messages
    const newConversation: DriveSearchResult<Conversation> = {
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
    conversation: DriveSearchResult<Conversation>;
  }) => {
    const newConversation: DriveSearchResult<Conversation> = {
      ...conversation,
      fileMetadata: {
        ...conversation.fileMetadata,
        appData: { ...conversation.fileMetadata.appData, archivalStatus: 0 },
      },
    };

    return await updateConversation(dotYouClient, newConversation);
  };

  return {
    single: useQuery({
      queryKey: ['conversation', conversationId],
      queryFn: () => getSingleConversation(dotYouClient, conversationId),
      refetchOnMount: false,
      enabled: !!conversationId,
    }),
    create: useMutation({
      mutationFn: createConversation,
      onMutate: async ({ recipients }) => {
        // TODO: Optimistic update of the conversations, append the new conversation
      },
      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({ queryKey: ['conversation', _data?.newConversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      },
    }),
    inviteRecipient: useMutation({
      mutationFn: sendJoinCommand,
    }),
    update: useMutation({
      mutationFn: updateExistingConversation,
      onMutate: async () => {
        // TODO: Optimistic update of the conversations, append the new conversation
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
      onMutate: async ({ conversation }) => {
        // TODO: Optimistic update of the conversations, append the new conversation
      },
      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
        });
        queryClient.invalidateQueries({
          queryKey: ['chat', variables.conversation.fileMetadata.appData.uniqueId],
        });
      },
    }),
    deleteChat: useMutation({
      mutationFn: deleteChat,
      onMutate: async ({ conversation }) => {
        // TODO: Optimistic update of the conversations, append the new conversation
      },
      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['conversations'],
        });
        queryClient.invalidateQueries({
          queryKey: ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
        });
        queryClient.invalidateQueries({
          queryKey: ['chat', variables.conversation.fileMetadata.appData.uniqueId],
        });
      },
    }),
    restoreChat: useMutation({
      mutationFn: restoreChat,
      onMutate: async ({ conversation }) => {
        // TODO: Optimistic update of the conversations, append the new conversation
      },
      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['conversations'],
        });
        queryClient.invalidateQueries({
          queryKey: ['conversation', variables.conversation.fileMetadata.appData.uniqueId],
        });
        queryClient.invalidateQueries({
          queryKey: ['chat', variables.conversation.fileMetadata.appData.uniqueId],
        });
      },
    }),
  };
};
