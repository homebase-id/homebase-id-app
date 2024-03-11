import { InfiniteData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  DriveSearchResult,
  NewDriveSearchResult,
  SecurityGroupType,
  TransferStatus,
} from '@youfoundation/js-lib/core';
import { getNewId } from '@youfoundation/js-lib/helpers';

import { useDotYouClientContext } from 'feed-app-common';
import {
  ChatDeliveryStatus,
  ChatMessage,
  getChatMessage,
  updateChatMessage,
  uploadChatMessage,
} from '../../provider/chat/ChatProvider';
import { ImageSource } from '../../provider/image/RNImageProvider';

export const useChatMessage = (props?: { messageId: string | undefined }) => {
  const queryClient = useQueryClient();
  const dotYouClient = useDotYouClientContext();

  const getMessageByUniqueId = async (messageId: string) => {
    // TODO: Improve by fetching the message from the cache on conversations first
    return await getChatMessage(dotYouClient, messageId);
  };

  const sendMessage = async ({
    conversationId,
    recipients,
    replyId,
    files,
    message,
  }: {
    conversationId: string;
    recipients: string[];
    replyId?: string;
    files?: ImageSource[];
    message: string;
  }): Promise<NewDriveSearchResult<ChatMessage> | null> => {
    const newChatId = getNewId();
    const newChat: NewDriveSearchResult<ChatMessage> = {
      fileMetadata: {
        appData: {
          uniqueId: newChatId,
          groupId: conversationId,
          content: {
            message: message,
            deliveryStatus: ChatDeliveryStatus.Sent,
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

    const uploadResult = await uploadChatMessage(dotYouClient, newChat, recipients, files);
    if (!uploadResult) throw new Error('Failed to send the chat message');

    newChat.fileId = uploadResult.file.fileId;
    newChat.fileMetadata.versionTag = uploadResult.newVersionTag;
    newChat.fileMetadata.appData.previewThumbnail = uploadResult.previewThumbnail;

    const deliveredToInboxes = recipients.map(
      (recipient) =>
        uploadResult.recipientStatus[recipient].toLowerCase() === TransferStatus.DeliveredToInbox
    );

    if (recipients.length && deliveredToInboxes.every((delivered) => delivered)) {
      newChat.fileMetadata.appData.content.deliveryStatus = ChatDeliveryStatus.Delivered;
      await updateChatMessage(dotYouClient, newChat, recipients, uploadResult.keyHeader);
    }
    return newChat;
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
      mutationFn: sendMessage,
      onMutate: async ({ conversationId, recipients, replyId, files, message }) => {
        // TODO: Optimistic update of the chat messages append the new message to the list
        const existingData = queryClient.getQueryData<
          InfiniteData<{
            searchResults: (DriveSearchResult<ChatMessage> | null)[];
            cursorState: string;
            queryTime: number;
            includeMetadataHeader: boolean;
          }>
        >(['chat', conversationId]);

        if (!existingData) return;

        const newMessageDsr: NewDriveSearchResult<ChatMessage> = {
          fileMetadata: {
            appData: {
              groupId: conversationId,
              content: {
                message: message || (files?.length ? '📷 Media' : ''),
                deliveryStatus: ChatDeliveryStatus.Sending,
                replyId: replyId,
              },
            },
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

        queryClient.setQueryData(['chat', conversationId], newData);
        return { existingData };
      },
      onError: (err, messageParams, context) => {
        console.error('Failed to send the chat message', err);
        queryClient.setQueryData(['chat', messageParams.conversationId], context?.existingData);
      },
      onSettled: async (_data, _error, variables) => {
        queryClient.invalidateQueries({ queryKey: ['chat', variables.conversationId] });
      },
    }),
  };
};
