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
  ImageContentType,
  NewHomebaseFile,
  NewPayloadDescriptor,
  RichText,
  SecurityGroupType,
} from '@homebase-id/js-lib/core';
import { getNewId, stringGuidsEqual } from '@homebase-id/js-lib/helpers';

import { t, useDotYouClientContext } from 'homebase-id-app-common';
import {
  ChatDeliveryStatus,
  ChatMessage,
  getChatMessage,
  updateChatMessage,
  uploadChatMessage,
} from '../../provider/chat/ChatProvider';
import { ImageSource } from '../../provider/image/RNImageProvider';
import {
  ChatDrive,
  ConversationWithYourselfId,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { getSynchronousDotYouClient } from './getSynchronousDotYouClient';
import { useErrors, addError, generateClientError } from '../errors/useErrors';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { insertNewMessage } from './useChatMessages';
import { insertImageIntoCache } from '../../components/ui/OdinImage/hooks/useImage';
import { copyFileIntoCache } from '../../utils/utils';
import { addLogs } from '../../provider/log/logger';
import { unlink } from 'react-native-fs';

const sendMessage = async ({
  conversation,
  replyId,
  files,
  message,
  linkPreviews,
  chatId,
  userDate,
  queryClient,
}: {
  conversation: HomebaseFile<UnifiedConversation>;
  replyId?: string;
  files?: ImageSource[];
  message: string | RichText;
  linkPreviews?: LinkPreview[];
  chatId?: string;
  userDate?: number;
  queryClient: QueryClient;
}): Promise<NewHomebaseFile<ChatMessage> | null> => {
  const dotYouClient = await getSynchronousDotYouClient();

  const conversationId = conversation.fileMetadata.appData.uniqueId as string;
  const conversationContent = conversation.fileMetadata.appData.content;
  const identity = dotYouClient.getIdentity();
  const recipients = conversationContent.recipients.filter((recipient) => recipient !== identity);

  const newChatId = chatId || getNewId();
  const newUserDate = userDate || new Date().getTime();
  const newChat: NewHomebaseFile<ChatMessage> = {
    fileMetadata: {
      created: newUserDate,
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
        userDate: newUserDate,
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

  // We copy into pendingFiles as the upload will unlink
  const pendingFiles = await Promise.all(
    (files || [])?.map(async (file) => {
      const newFilePath = await copyFileIntoCache(
        file.uri || (file.filepath as string),
        file.type || undefined
      );

      return { ...file, filepath: newFilePath, uri: newFilePath };
    })
  );

  const uploadResult = await uploadChatMessage(
    dotYouClient,
    newChat,
    recipients,
    pendingFiles,
    linkPreviews,
    recipients.length > 1
      ? conversationContent.title
        ? `${identity} sent a message to ${conversationContent.title}`
        : `${identity} sent a message in a group chat`
      : undefined,
    undefined,
    onUpdate
  );
  if (!uploadResult) throw new Error('Failed to send the chat message');

  newChat.fileId = uploadResult.file.fileId;
  newChat.fileMetadata.versionTag = uploadResult.newVersionTag;
  newChat.fileMetadata.appData.previewThumbnail = uploadResult.previewThumbnail;
  newChat.fileMetadata.appData.content.deliveryStatus =
    uploadResult.chatDeliveryStatus || ChatDeliveryStatus.Sent;

  // Insert images into useImage cache:
  const fileMetadataPayloads: NewPayloadDescriptor[] = await Promise.all(
    (files || [])?.map(async (file, index) => {
      const key = `chat_mbl${index}`;

      try {
        if (file.type?.startsWith('image/')) {
          const cachedImagePath = await copyFileIntoCache(
            file.uri || file.filepath || '',
            file.type
          );

          console.log('locally inserted cache', cachedImagePath);

          insertImageIntoCache(
            queryClient,
            undefined,
            uploadResult.file.fileId,
            key,
            ChatDrive,
            undefined,
            {
              url: cachedImagePath,
              type: (file.type as ImageContentType) || undefined,
              naturalSize: {
                pixelWidth: file.width,
                pixelHeight: file.height,
              },
            }
          );
        }
      } catch {}

      return {
        key,
        contentType: file.type || undefined,
        pendingFile:
          file.filepath || file.uri
            ? (new OdinBlob((file.uri || file.filepath) as string, {
                type: file.type || undefined,
              }) as unknown as Blob)
            : undefined,
      };
    })
  );

  // Cleanup as much files as possible
  await Promise.all(
    (files || [])?.map(async (file) => {
      try {
        console.log('unlinking', file.uri || file.filepath || '');
        await unlink(file.uri || file.filepath || '');
      } catch {
        console.error('Failed to unlink', file.uri || file.filepath || '');
      }
    })
  );

  newChat.fileMetadata.payloads = fileMetadataPayloads;
  return newChat;
};

export const getSendChatMessageMutationOptions: (queryClient: QueryClient) => UseMutationOptions<
  NewHomebaseFile<ChatMessage> | null,
  unknown,
  {
    conversation: HomebaseFile<UnifiedConversation>;
    replyId?: string;
    files?: ImageSource[];
    message: string | RichText;
    linkPreviews?: LinkPreview[];
    userDate?: number;
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
  onMutate: async ({ conversation, replyId, files, message, chatId, userDate }) => {
    const newMessageDsr: NewHomebaseFile<ChatMessage> = {
      fileMetadata: {
        created: userDate,
        appData: {
          uniqueId: chatId,
          groupId: conversation.fileMetadata.appData.uniqueId,
          content: {
            message: message,
            deliveryStatus: ChatDeliveryStatus.Sending,
            replyId: replyId,
          },
          userDate,
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
        payloads: files?.map((file, index) => ({
          key: `chat_mbl${index}`,
          contentType: file.type || undefined,
          pendingFile:
            file.filepath || file.uri
              ? (new OdinBlob((file.uri || file.filepath) as string, {
                  type: file.type || undefined,
                }) as unknown as Blob)
              : undefined,
        })),
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Connected,
        },
      },
    };

    const { extistingMessages } = insertNewMessage(queryClient, newMessageDsr);
    if (!extistingMessages) {
      return;
    }
    return { existingData: extistingMessages };
  },
  onSuccess: async (newMessage) => {
    if (!newMessage) return;
    insertNewMessage(queryClient, newMessage);
  },
  onError: (err, messageParams, context) => {
    addError(queryClient, err, t('Failed to send the chat message'));

    queryClient.setQueryData(
      ['chat-messages', messageParams.conversation.fileMetadata.appData.uniqueId],
      context?.existingData
    );
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

export const useChatMessage = (props?: {
  conversationId?: string | undefined; // Optional: if we have it we can use the cache
  messageId: string | undefined;
}) => {
  const queryClient = useQueryClient();
  const dotYouClient = useDotYouClientContext();
  const addError = useErrors().add;

  const getMessageByUniqueId = async (conversationId: string | undefined, messageId: string) => {
    const extistingMessages = conversationId
      ? queryClient.getQueryData<
          InfiniteData<{
            searchResults: (HomebaseFile<ChatMessage> | null)[];
            cursorState: string;
            queryTime: number;
            includeMetadataHeader: boolean;
          }>
        >(['chat-messages', conversationId])
      : undefined;

    if (extistingMessages) {
      const message = extistingMessages.pages
        .flatMap((page) => page.searchResults)
        .find((msg) => stringGuidsEqual(msg?.fileMetadata.appData.uniqueId, messageId));

      if (message) {
        return message;
      }
    }

    return await getChatMessage(dotYouClient, messageId);
  };

  return {
    get: useQuery({
      queryKey: ['chat-message', props?.messageId],
      queryFn: () => getMessageByUniqueId(props?.conversationId, props?.messageId as string),
      enabled: !!props?.messageId,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      throwOnError: (error, _) => {
        const newError = generateClientError(error, t('Failed to get the chat message'));
        addLogs(newError);
        return false;
      },
    }),
    send: useMutation({
      ...getSendChatMessageMutationOptions(queryClient),
      onError: (err, messageParams, context) => {
        addError(err, t('Failed to send the chat message'));
        queryClient.setQueryData(
          ['chat-messages', messageParams.conversation.fileMetadata.appData.uniqueId],
          context?.existingData
        );
      },
    }),
    update: useMutation(getUpdateChatMessageMutationOptions(queryClient)),
  };
};
