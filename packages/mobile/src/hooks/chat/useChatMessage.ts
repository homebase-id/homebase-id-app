import {
  InfiniteData,
  QueryClient,
  UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  HomebaseFile,
  NewHomebaseFile,
  NewPayloadDescriptor,
  SecurityGroupType,
  TransferStatus,
} from '@youfoundation/js-lib/core';
import { getNewId, stringGuidsEqual } from '@youfoundation/js-lib/helpers';

import { t, useDotYouClientContext } from 'feed-app-common';
import {
  ChatDeliveryStatus,
  ChatMessage,
  getChatMessage,
  updateChatMessage,
  uploadChatMessage,
} from '../../provider/chat/ChatProvider';
import { ImageSource } from '../../provider/image/RNImageProvider';
import {
  ConversationWithYourselfId,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { getSynchronousDotYouClient } from './getSynchronousDotYouClient';
import { useErrors, addError } from '../errors/useErrors';

const sendMessage = async ({
  conversation,
  replyId,
  files,
  message,
  chatId,
  queryClient,
}: {
  conversation: HomebaseFile<UnifiedConversation>;
  replyId?: string;
  files?: ImageSource[];
  message: string;
  chatId?: string;
  queryClient: QueryClient;
}): Promise<NewHomebaseFile<ChatMessage> | null> => {
  const dotYouClient = await getSynchronousDotYouClient();

  const conversationId = conversation.fileMetadata.appData.uniqueId as string;
  const conversationContent = conversation.fileMetadata.appData.content;
  const identity = dotYouClient.getIdentity();
  const recipients = conversationContent.recipients.filter((recipient) => recipient !== identity);

  const newChatId = chatId || getNewId();
  const newChat: NewHomebaseFile<ChatMessage> = {
    fileMetadata: {
      appData: {
        uniqueId: newChatId,
        groupId: conversationId,
        content: {
          message: message,
          deliveryStatus: stringGuidsEqual(conversationId, ConversationWithYourselfId)
            ? ChatDeliveryStatus.Read
            : ChatDeliveryStatus.Sent,
          replyId: replyId,
        },
        userDate: new Date().getTime(),
      },
    },
    serverMetadata: {
      accessControlList: {
        requiredSecurityGroup: SecurityGroupType.Connected,
      },
    },
  };

  const onUpdate = (phase: string, progress: number) => {
    const extistingMessage = queryClient.getQueryData<
      InfiniteData<{
        searchResults: (HomebaseFile<ChatMessage> | null)[];
        cursorState: string;
        queryTime: number;
        includeMetadataHeader: boolean;
      }>
    >(['chat-messages', conversation.fileMetadata.appData.uniqueId]);

    const updatedData = {
      ...extistingMessage,
      pages: extistingMessage?.pages?.map((page) => ({
        ...page,
        searchResults: page.searchResults.map((msg) =>
          stringGuidsEqual(
            msg?.fileMetadata.appData.uniqueId,
            newChat.fileMetadata.appData.uniqueId
          )
            ? ({
                ...msg,
                fileMetadata: {
                  ...msg?.fileMetadata,
                  payloads: (msg?.fileMetadata.payloads?.map((payload) => ({
                    ...payload,
                    uploadProgress: { phase, progress },
                  })) || []) as NewPayloadDescriptor,
                },
              } as HomebaseFile<ChatMessage>)
            : msg
        ),
      })),
    };

    queryClient.setQueryData(
      ['chat-messages', conversation.fileMetadata.appData.uniqueId],
      updatedData
    );
  };

  const uploadResult = await uploadChatMessage(
    dotYouClient,
    newChat,
    recipients,
    files,
    undefined,
    onUpdate
  );
  if (!uploadResult) throw new Error('Failed to send the chat message');

  newChat.fileId = uploadResult.file.fileId;
  newChat.fileMetadata.versionTag = uploadResult.newVersionTag;
  newChat.fileMetadata.appData.previewThumbnail = uploadResult.previewThumbnail;

  return newChat;
};

export const getSendChatMessageMutationOptions: (queryClient: QueryClient) => UseMutationOptions<
  unknown,
  unknown,
  {
    conversation: HomebaseFile<UnifiedConversation>;
    replyId?: string;
    files?: ImageSource[];
    message: string;
    chatId?: string;
  },
  {
    existingData: InfiniteData<{
      searchResults: (HomebaseFile<ChatMessage> | null)[];
      cursorState: string;
      queryTime: number;
      includeMetadataHeader: boolean;
    }>;
  }
> = (queryClient) => ({
  mutationKey: ['send-chat-message'],
  mutationFn: async (params) => sendMessage({ ...params, queryClient }),
  onMutate: async ({ conversation, replyId, files, message, chatId }) => {
    const existingData = queryClient.getQueryData<
      InfiniteData<{
        searchResults: (HomebaseFile<ChatMessage> | null)[];
        cursorState: string;
        queryTime: number;
        includeMetadataHeader: boolean;
      }>
    >(['chat-messages', conversation.fileMetadata.appData.uniqueId]);

    if (!existingData) return;

    const newMessageDsr: NewHomebaseFile<ChatMessage> = {
      fileMetadata: {
        appData: {
          uniqueId: chatId,
          groupId: conversation.fileMetadata.appData.uniqueId,
          content: {
            message: message,
            deliveryStatus: ChatDeliveryStatus.Sending,
            replyId: replyId,
          },
          previewThumbnail:
            files && files.length === 1
              ? {
                  contentType: files[0].type as string,
                  content: files[0].uri || files[0].filepath || '',
                  pixelWidth: files[0].width,
                  pixelHeight: files[0].height,
                }
              : undefined,
        },
        payloads: files?.map((file) => ({
          contentType: file.type || undefined,
          pendingFile:
            file.filepath || file.uri
              ? (new OdinBlob((file.uri || file.filepath) as string, {
                  type: file.type || undefined,
                }) as any as Blob)
              : undefined,
        })),
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Connected,
        },
      },
    };
    const newData = {
      ...existingData,
      pages: existingData?.pages?.map((page) => ({
        ...page,
        searchResults: [newMessageDsr, ...page.searchResults],
      })),
    };

    queryClient.setQueryData(
      ['chat-messages', conversation.fileMetadata.appData.uniqueId],
      newData
    );
    return { existingData };
  },
  onError: (err, messageParams, context) => {
    addError(queryClient, err, t('Failed to send the chat message'));

    queryClient.setQueryData(
      ['chat-messages', messageParams.conversation.fileMetadata.appData.uniqueId],
      context?.existingData
    );
  },
  onSettled: async (_data, _error, variables) => {
    queryClient.invalidateQueries({
      queryKey: ['chat-messages', variables.conversation.fileMetadata.appData.uniqueId],
    });
  },
});

const updateMessage = async ({
  updatedChatMessage,
  conversation,
}: {
  updatedChatMessage: HomebaseFile<ChatMessage>;
  conversation: HomebaseFile<UnifiedConversation>;
}) => {
  const dotYouClient = await getSynchronousDotYouClient();
  const conversationContent = conversation.fileMetadata.appData.content;
  const identity = dotYouClient.getIdentity();
  const recipients = conversationContent.recipients.filter((recipient) => recipient !== identity);

  await updateChatMessage(dotYouClient, updatedChatMessage, recipients);
};

export const getUpdateChatMessageMutationOptions: (queryClient: QueryClient) => UseMutationOptions<
  unknown,
  unknown,
  {
    updatedChatMessage: HomebaseFile<ChatMessage>;
    conversation: HomebaseFile<UnifiedConversation>;
  },
  {
    extistingMessages:
      | InfiniteData<
          {
            searchResults: (HomebaseFile<ChatMessage> | null)[];
            cursorState: string;
            queryTime: number;
            includeMetadataHeader: boolean;
          },
          unknown
        >
      | undefined;
    existingMessage: HomebaseFile<ChatMessage> | undefined;
  }
> = (queryClient) => ({
  mutationKey: ['update-chat-message'],
  mutationFn: updateMessage,
  onMutate: async ({ conversation, updatedChatMessage }) => {
    // Update chat messages
    const extistingMessages = queryClient.getQueryData<
      InfiniteData<{
        searchResults: (HomebaseFile<ChatMessage> | null)[];
        cursorState: string;
        queryTime: number;
        includeMetadataHeader: boolean;
      }>
    >(['chat-messages', conversation.fileMetadata.appData.uniqueId]);

    if (extistingMessages) {
      const newData = {
        ...extistingMessages,
        pages: extistingMessages?.pages?.map((page) => ({
          ...page,
          searchResults: page.searchResults.map((msg) =>
            stringGuidsEqual(msg?.fileId, updatedChatMessage.fileId) ? updatedChatMessage : msg
          ),
        })),
      };
      queryClient.setQueryData(
        ['chat-messages', conversation.fileMetadata.appData.uniqueId],
        newData
      );
    }

    // Update chat message
    const existingMessage = queryClient.getQueryData<HomebaseFile<ChatMessage>>([
      'chat-message',
      updatedChatMessage.fileMetadata.appData.uniqueId,
    ]);

    if (existingMessage) {
      queryClient.setQueryData(
        ['chat-message', updatedChatMessage.fileMetadata.appData.uniqueId],
        updatedChatMessage
      );
    }

    return { extistingMessages, existingMessage };
  },

  onError: (err, messageParams, context) => {
    addError(queryClient, err, t('Failed to update the chat message'));

    queryClient.setQueryData(
      ['chat-messages', messageParams.conversation.fileMetadata.appData.uniqueId],
      context?.extistingMessages
    );

    queryClient.setQueryData(
      ['chat-message', messageParams.updatedChatMessage.fileMetadata.appData.uniqueId],
      context?.existingMessage
    );
  },
});

export const useChatMessage = (props?: { messageId: string | undefined }) => {
  const queryClient = useQueryClient();
  const dotYouClient = useDotYouClientContext();
  const addError = useErrors().add;

  const getMessageByUniqueId = async (messageId: string) => {
    // TODO: Improve by fetching the message from the cache on conversations first
    return await getChatMessage(dotYouClient, messageId);
  };

  return {
    get: useQuery({
      queryKey: ['chat-message', props?.messageId],
      queryFn: () => getMessageByUniqueId(props?.messageId as string),
      enabled: !!props?.messageId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }),
    send: useMutation({
      ...getSendChatMessageMutationOptions(queryClient),
      onError: (err, messageParams, context) => {
        addError(err);
        queryClient.setQueryData(
          ['chat-messages', messageParams.conversation.fileMetadata.appData.uniqueId],
          context?.existingData
        );
      },
    }),
    update: useMutation(getUpdateChatMessageMutationOptions(queryClient)),
  };
};
