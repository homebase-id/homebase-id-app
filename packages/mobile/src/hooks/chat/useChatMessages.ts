import {
  UndefinedInitialDataInfiniteOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ChatDeliveryStatus,
  ChatMessage,
  getChatMessages,
  requestMarkAsRead,
  softDeleteChatMessage,
} from '../../provider/chat/ChatProvider';
import {
  Conversation,
  GroupConversation,
  SingleConversation,
} from '../../provider/chat/ConversationProvider';
import { DotYouClient, HomebaseFile } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';

const FIRST_PAGE_SIZE = 15;
const PAGE_SIZE = 100;

export const useChatMessages = (props?: { conversationId: string | undefined }) => {
  const { conversationId } = props || { conversationId: undefined };
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const markAsRead = async ({
    conversation,
    messages,
  }: {
    conversation: HomebaseFile<Conversation>;
    messages: HomebaseFile<ChatMessage>[];
  }) => {
    // => Much nicer solution: Handle with a last read time on the conversation file;
    const messagesToMarkAsRead = messages
      .filter(
        (msg) =>
          msg.fileMetadata.appData.content.deliveryStatus !== ChatDeliveryStatus.Read &&
          msg.fileMetadata.senderOdinId &&
          msg.fileMetadata.globalTransitId
      )
      .map((msg) => msg.fileMetadata.globalTransitId) as string[];

    return await requestMarkAsRead(dotYouClient, conversation, messagesToMarkAsRead);
  };

  const removeMessage = async ({
    conversation,
    messages,
    deleteForEveryone,
  }: {
    conversation: HomebaseFile<Conversation>;
    messages: HomebaseFile<ChatMessage>[];
    deleteForEveryone?: boolean;
  }) => {
    const conversationContent = conversation.fileMetadata.appData.content;
    const recipients = (conversationContent as GroupConversation).recipients || [
      (conversationContent as SingleConversation).recipient,
    ];

    return await Promise.all(
      messages.map(async (msg) => {
        await softDeleteChatMessage(
          dotYouClient,
          msg,
          recipients.filter(Boolean),
          deleteForEveryone
        );
      })
    );
  };

  return {
    all: useInfiniteQuery(getChatMessageInfiniteQueryOptions(dotYouClient, conversationId)),
    markAsRead: useMutation({
      mutationKey: ['markAsRead', conversationId],
      mutationFn: markAsRead,
      onError: (error) => {
        console.error('Error marking chat as read', { error });
      },
    }),
    delete: useMutation({
      mutationFn: removeMessage,
      onMutate: async () => {
        // TODO: Optimistic update of the chat messages delete the new message from the list
      },
      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['chat-messages', variables.conversation.fileMetadata.appData.uniqueId],
        });
      },
    }),
  };
};

const fetchMessages = async (
  dotYouClient: DotYouClient,
  conversationId: string,
  cursorState: string | undefined
) => {
  // console.log(
  //   'fetch',
  //   ['chat-messages', conversationId],
  //   cursorState ? PAGE_SIZE : FIRST_PAGE_SIZE
  // );
  return await getChatMessages(
    dotYouClient,
    conversationId,
    cursorState,
    cursorState ? PAGE_SIZE : FIRST_PAGE_SIZE
  );
};

export const getChatMessageInfiniteQueryOptions: (
  dotYouClient: DotYouClient,
  conversationId: string | undefined
) => UndefinedInitialDataInfiniteOptions<{
  searchResults: (HomebaseFile<ChatMessage> | null)[];
  cursorState: string;
  queryTime: number;
  includeMetadataHeader: boolean;
}> = (dotYouClient, conversationId) => ({
  queryKey: ['chat-messages', conversationId],
  initialPageParam: undefined as string | undefined,
  queryFn: ({ pageParam }) =>
    fetchMessages(dotYouClient, conversationId as string, pageParam as string | undefined),
  getNextPageParam: (lastPage, pages) =>
    lastPage && lastPage.searchResults?.length >= (lastPage === pages[0] ? FIRST_PAGE_SIZE : PAGE_SIZE)
      ? lastPage.cursorState
      : undefined,
  enabled: !!conversationId,
  staleTime: 1000 * 60 * 60 * 24, // 24 hour
});
