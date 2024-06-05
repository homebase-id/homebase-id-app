import {
  InfiniteData,
  QueryClient,
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

import { DotYouClient, HomebaseFile } from '@youfoundation/js-lib/core';
import { useDotYouClientContext } from 'feed-app-common';
import { UnifiedConversation } from '../../provider/chat/ConversationProvider';
import { stringGuidsEqual } from '@youfoundation/js-lib/helpers';

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
    conversation: HomebaseFile<UnifiedConversation>;
    messages: HomebaseFile<ChatMessage>[];
  }) => {
    return await requestMarkAsRead(dotYouClient, conversation, messages);
  };

  const removeMessage = async ({
    conversation,
    messages,
    deleteForEveryone,
  }: {
    conversation: HomebaseFile<UnifiedConversation>;
    messages: HomebaseFile<ChatMessage>[];
    deleteForEveryone?: boolean;
  }) => {
    const conversationContent = conversation.fileMetadata.appData.content;
    const identity = dotYouClient.getIdentity();
    const recipients = conversationContent.recipients.filter((recipient) => recipient !== identity);

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
    lastPage &&
    lastPage.searchResults?.length >= (lastPage === pages[0] ? FIRST_PAGE_SIZE : PAGE_SIZE)
      ? lastPage.cursorState
      : undefined,
  enabled: !!conversationId,
  // staleTime: 1000 * 60 * 60 * 24, // 24 hour
});

export const insertNewMessage = (
  queryClient: QueryClient,
  newMessage: HomebaseFile<ChatMessage>,
  isUpdate?: boolean
) => {
  const conversationId = newMessage.fileMetadata.appData.groupId;

  const extistingMessages = queryClient.getQueryData<
    InfiniteData<{
      searchResults: (HomebaseFile<ChatMessage> | null)[];
      cursorState: string;
      queryTime: number;
      includeMetadataHeader: boolean;
    }>
  >(['chat-messages', conversationId]);

  if (extistingMessages) {
    const isNewFile =
      isUpdate === undefined
        ? !extistingMessages.pages.some((page) =>
            page.searchResults.some((msg) => stringGuidsEqual(msg?.fileId, newMessage.fileId))
          )
        : !isUpdate;

    const newData = {
      ...extistingMessages,
      pages: extistingMessages?.pages?.map((page, index) => {
        if (isNewFile) {
          const filteredSearchResults = page.searchResults.filter(
            // Remove messages without a fileId, as the optimistic mutations should be removed when there's actual data coming over the websocket;
            //   And There shouldn't be any duplicates, but just in case
            (msg) => msg && msg?.fileId && !stringGuidsEqual(msg?.fileId, newMessage.fileId)
          ) as HomebaseFile<ChatMessage>[];

          return {
            ...page,
            searchResults:
              index === 0
                ? [newMessage, ...filteredSearchResults].sort(
                    (a, b) => b.fileMetadata.created - a.fileMetadata.created
                  ) // Re-sort the first page, as the new message might be older than the first message in the page;
                : filteredSearchResults,
          };
        }

        return {
          ...page,
          searchResults: page.searchResults.map((msg) =>
            msg?.fileId && stringGuidsEqual(msg?.fileId, newMessage.fileId) ? newMessage : msg
          ),
        };
      }),
    };

    queryClient.setQueryData(['chat-messages', conversationId], newData);
  } else {
    queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
  }

  queryClient.setQueryData(['chat-message', newMessage.fileMetadata.appData.uniqueId], newMessage);
};
