import {
  AppFileMetaData,
  DotYouClient,
  HomebaseFile,
  EmbeddedThumb,
  FileMetadata,
  FileQueryParams,
  GetBatchQueryResultOptions,
  ImageContentType,
  KeyHeader,
  NewHomebaseFile,
  PayloadFile,
  ScheduleOptions,
  SecurityGroupType,
  SendContents,
  TargetDrive,
  ThumbnailFile,
  UploadFileMetadata,
  UploadInstructionSet,
  deleteFilesByGroupId,
  deletePayload,
  getContentFromHeaderOrPayload,
  getFileHeaderByUniqueId,
  queryBatch,
  sendCommand,
  uploadFile,
  uploadHeader,
  UploadResult,
} from '@youfoundation/js-lib/core';
import { ChatDrive, UnifiedConversation } from './ConversationProvider';
import { assertIfDefined, getNewId, jsonStringify64 } from '@youfoundation/js-lib/helpers';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { ImageSource } from '../image/RNImageProvider';
import { createThumbnails } from '../image/RNThumbnailProvider';
import { grabThumbnail, processVideo } from '../image/RNVideoProviderSegmenter';
import { VideoContentType } from '@youfoundation/js-lib/media';

const CHAT_APP_ID = '2d781401-3804-4b57-b4aa-d8e4e2ef39f4';

export const CHAT_MESSAGE_FILE_TYPE = 7878;
export const ChatDeletedArchivalStaus = 2;

export enum ChatDeliveryStatus {
  // NotSent = 10, // NotSent is not a valid atm, when it's not sent, it doesn't "exist"
  Sending = 15, // When it's sending; Used for optimistic updates

  Sent = 20, // when delivered to your identity
  Delivered = 30, // when delivered to the recipient inbox
  Read = 40, // when the recipient has read the message
  Failed = 50, // when the message failed to send to the recipient
}

export enum MessageType {
  Text = 0,
  Image = 1,
  Video = 2,
  Audio = 3,
  File = 4,
  Location = 5,
  Sticker = 6,
  Contact = 7,
  Custom = 8,
}

export interface ChatMessage {
  replyId?: string; //=> Better to use the groupId (unless that would break finding the messages of a conversation)...

  /// Type of the message
  // messageType: MessageType;

  /// FileState of the Message
  /// [FileState.active] shows the message is active
  /// [FileState.deleted] shows the message is deleted. It's soft deleted
  // fileState: FileState => archivalStatus

  /// Content of the message
  message: string;

  // reactions: string;

  /// DeliveryStatus of the message. Indicates if the message is sent, delivered or read
  deliveryStatus: ChatDeliveryStatus;
  deliveryDetails?: Record<string, ChatDeliveryStatus>;
}

const CHAT_MESSAGE_PAYLOAD_KEY = 'chat_mbl';

export const getChatMessages = async (
  dotYouClient: DotYouClient,
  conversationId: string,
  cursorState: string | undefined,
  pageSize: number
) => {
  assertIfDefined('dotYouClient', dotYouClient);
  assertIfDefined('conversationId', conversationId);

  const params: FileQueryParams = {
    targetDrive: ChatDrive,
    groupId: [conversationId],
  };

  const ro: GetBatchQueryResultOptions = {
    maxRecords: pageSize,
    cursorState: cursorState,
    includeMetadataHeader: true,
  };

  const response = await queryBatch(dotYouClient, params, ro);
  return {
    ...response,
    searchResults: await Promise.all(
      response.searchResults.map(
        async (result) => await dsrToMessage(dotYouClient, result, ChatDrive, true)
      )
    ),
  };
};

export const deleteAllChatMessages = async (dotYouClient: DotYouClient, conversationId: string) => {
  return await deleteFilesByGroupId(dotYouClient, ChatDrive, [conversationId]);
};

export const getChatMessage = async (dotYouClient: DotYouClient, chatMessageId: string) => {
  const fileHeader = await getFileHeaderByUniqueId<ChatMessage>(
    dotYouClient,
    ChatDrive,
    chatMessageId
  );
  if (!fileHeader) return null;

  return fileHeader;
};

export const dsrToMessage = async (
  dotYouClient: DotYouClient,
  dsr: HomebaseFile,
  targetDrive: TargetDrive,
  includeMetadataHeader: boolean
): Promise<HomebaseFile<ChatMessage> | null> => {
  try {
    const attrContent = await getContentFromHeaderOrPayload<ChatMessage>(
      dotYouClient,
      targetDrive,
      dsr,
      includeMetadataHeader
    );
    if (!attrContent) return null;

    const chatMessage: HomebaseFile<ChatMessage> = {
      ...dsr,
      fileMetadata: {
        ...dsr.fileMetadata,
        appData: {
          ...dsr.fileMetadata.appData,
          content: attrContent,
        },
      },
    };

    return chatMessage;
  } catch (ex) {
    console.error('[DotYouCore-js] failed to get the chatMessage payload of a dsr', dsr, ex);
    return null;
  }
};

export const uploadChatMessage = async (
  dotYouClient: DotYouClient,
  message: NewHomebaseFile<ChatMessage>,
  recipients: string[],
  files: ImageSource[] | undefined,
  onVersionConflict?: () => void,
  onUpdate?: (phase: string, progress: number) => void
) => {
  const messageContent = message.fileMetadata.appData.content;
  const distribute = recipients?.length > 0;

  const uploadInstructions: UploadInstructionSet = {
    storageOptions: {
      drive: ChatDrive,
      overwriteFileId: message.fileId,
    },
    transitOptions: distribute
      ? {
          recipients: [...recipients],
          schedule: ScheduleOptions.SendNowAwaitResponse,
          sendContents: SendContents.All,
          useAppNotification: true,
          appNotificationOptions: {
            appId: CHAT_APP_ID,
            typeId: message.fileMetadata.appData.groupId as string,
            tagId: getNewId(),
            silent: false,
          },
        }
      : undefined,
  };

  const jsonContent: string = jsonStringify64({ ...messageContent });
  const uploadMetadata: UploadFileMetadata = {
    versionTag: message?.fileMetadata.versionTag,
    allowDistribution: distribute,
    appData: {
      uniqueId: message.fileMetadata.appData.uniqueId,
      groupId: message.fileMetadata.appData.groupId,
      userDate: message.fileMetadata.appData.userDate,
      fileType: CHAT_MESSAGE_FILE_TYPE,
      content: jsonContent,
    },
    isEncrypted: true,
    accessControlList: message.serverMetadata?.accessControlList || {
      requiredSecurityGroup: SecurityGroupType.Connected,
    },
  };

  const payloads: PayloadFile[] = [];
  const thumbnails: ThumbnailFile[] = [];
  const previewThumbnails: EmbeddedThumb[] = [];

  for (let i = 0; files && i < files?.length; i++) {
    const payloadKey = `${CHAT_MESSAGE_PAYLOAD_KEY}${i}`;
    const newMediaFile = files[i];

    if (newMediaFile.type?.startsWith('video/')) {
      const { video: processedMedia, metadata } = await processVideo(
        newMediaFile,
        true,
        (progress) => onUpdate?.('Compressing', progress)
      );

      onUpdate?.('Generating thumbnails', 0);
      // Custom blob to avoid reading and writing the file to disk again
      const payloadBlob = new OdinBlob((processedMedia.filepath || processedMedia.uri) as string, {
        type: 'video/mp4' as VideoContentType,
      }) as any as Blob;

      const thumbnail = await grabThumbnail(newMediaFile);
      const thumbSource: ImageSource | null = thumbnail
        ? {
            uri: thumbnail.uri,
            width: processedMedia.width || 1920,
            height: processedMedia.height || 1080,
            type: thumbnail.type,
          }
        : null;
      const { tinyThumb, additionalThumbnails } =
        thumbSource && thumbnail
          ? await createThumbnails(thumbSource, payloadKey, thumbnail.type as ImageContentType, [
              { quality: 100, width: 250, height: 250 },
            ])
          : { tinyThumb: undefined, additionalThumbnails: undefined };
      if (additionalThumbnails) {
        thumbnails.push(...additionalThumbnails);
      }
      payloads.push({
        key: payloadKey,
        payload: payloadBlob,
        descriptorContent: metadata ? jsonStringify64(metadata) : undefined,
      });

      if (tinyThumb) previewThumbnails.push(tinyThumb);
    } else if (newMediaFile.type?.startsWith('image/')) {
      const blob = new OdinBlob(newMediaFile.filepath || newMediaFile.uri, {
        type: newMediaFile?.type || undefined,
      }) as any as Blob;

      const { additionalThumbnails, tinyThumb } = await createThumbnails(
        newMediaFile,
        payloadKey,
        (newMediaFile?.type as ImageContentType) || undefined,
        [
          { quality: 75, width: 250, height: 250 },
          { quality: 75, width: 1600, height: 1600 },
        ]
      );

      thumbnails.push(...additionalThumbnails);
      payloads.push({
        key: payloadKey,
        payload: blob,
      });

      if (tinyThumb) previewThumbnails.push(tinyThumb);
    } else {
      if (newMediaFile?.type) {
        const payloadBlob = new OdinBlob(newMediaFile.filepath || newMediaFile.uri, {
          type: newMediaFile.type,
        }) as any as Blob;

        payloads.push({
          key: payloadKey,
          payload: payloadBlob,
        });
      }
    }
  }

  uploadMetadata.appData.previewThumbnail = previewThumbnails[0];

  onUpdate?.('Uploading', 0);

  await new Promise<void>((resolve) =>
    setTimeout(() => {
      resolve();
    }, 1000 * 5)
  );

  const uploadResult = await uploadFile(
    dotYouClient,
    uploadInstructions,
    uploadMetadata,
    payloads,
    thumbnails,
    undefined,
    onVersionConflict,
    {
      onUploadProgress: (progress) => onUpdate?.('Uploading', progress.progress || 0),
    }
  );

  if (!uploadResult) return null;

  return {
    ...uploadResult,
    previewThumbnail: uploadMetadata.appData.previewThumbnail,
  };
};

export const updateChatMessage = async (
  dotYouClient: DotYouClient,
  message: HomebaseFile<ChatMessage> | NewHomebaseFile<ChatMessage>,
  recipients: string[],
  keyHeader?: KeyHeader
): Promise<UploadResult | void> => {
  const messageContent = message.fileMetadata.appData.content;
  const distribute = recipients?.length > 0;

  const uploadInstructions: UploadInstructionSet = {
    storageOptions: {
      drive: ChatDrive,
      overwriteFileId: message.fileId,
    },
    transitOptions: distribute
      ? {
          recipients: [...recipients],
          schedule: ScheduleOptions.SendNowAwaitResponse,
          sendContents: SendContents.All,
        }
      : undefined,
  };

  const payloadJson: string = jsonStringify64({ ...messageContent });
  const uploadMetadata: UploadFileMetadata = {
    versionTag: message?.fileMetadata.versionTag,
    allowDistribution: distribute,
    appData: {
      uniqueId: message.fileMetadata.appData.uniqueId,
      groupId: message.fileMetadata.appData.groupId,
      archivalStatus: (message.fileMetadata.appData as AppFileMetaData<ChatMessage>).archivalStatus,
      previewThumbnail: message.fileMetadata.appData.previewThumbnail,
      fileType: CHAT_MESSAGE_FILE_TYPE,
      content: payloadJson,
    },
    senderOdinId: (message.fileMetadata as FileMetadata<ChatMessage>).senderOdinId,
    isEncrypted: true,
    accessControlList: message.serverMetadata?.accessControlList || {
      requiredSecurityGroup: SecurityGroupType.Connected,
    },
  };

  return await uploadHeader(
    dotYouClient,
    keyHeader || (message as HomebaseFile<ChatMessage>).sharedSecretEncryptedKeyHeader,
    uploadInstructions,
    uploadMetadata,
    async () => {
      const existingChatMessage = await getChatMessage(
        dotYouClient,
        message.fileMetadata.appData.uniqueId as string
      );
      if (!existingChatMessage) return null;
      message.fileMetadata.versionTag = existingChatMessage.fileMetadata.versionTag;
      return await updateChatMessage(dotYouClient, message, recipients, keyHeader);
    }
  );
};

export const softDeleteChatMessage = async (
  dotYouClient: DotYouClient,
  message: HomebaseFile<ChatMessage>,
  recipients: string[],
  deleteForEveryone?: boolean
) => {
  message.fileMetadata.appData.archivalStatus = ChatDeletedArchivalStaus;
  let runningVersionTag = message.fileMetadata.versionTag;

  for (let i = 0; i < message.fileMetadata.payloads.length; i++) {
    const payload = message.fileMetadata.payloads[i];
    // TODO: Should the payload be deleted for everyone? With "TransitOptions"
    const deleteResult = await deletePayload(
      dotYouClient,
      ChatDrive,
      message.fileId,
      payload.key,
      runningVersionTag
    );

    if (!deleteResult) throw new Error('Failed to delete payload');
    runningVersionTag = deleteResult.newVersionTag;
  }

  message.fileMetadata.versionTag = runningVersionTag;
  message.fileMetadata.appData.content.message = '';
  return await updateChatMessage(dotYouClient, message, deleteForEveryone ? recipients : []);
};

export const MARK_CHAT_READ_COMMAND = 150;
export interface MarkAsReadRequest {
  conversationId: string;
  messageIds: string[];
}

export const requestMarkAsRead = async (
  dotYouClient: DotYouClient,
  conversation: HomebaseFile<UnifiedConversation>,
  chatUniqueIds: string[]
) => {
  const request: MarkAsReadRequest = {
    conversationId: conversation.fileMetadata.appData.uniqueId as string,
    messageIds: chatUniqueIds,
  };

  const conversationContent = conversation.fileMetadata.appData.content;
  const identity = dotYouClient.getIdentity();
  const recipients = conversationContent.recipients.filter((recipient) => recipient !== identity);
  if (!recipients?.filter(Boolean)?.length) {
    throw new Error('No recipients found in the conversation');
  }

  return await sendCommand(
    dotYouClient,
    {
      code: MARK_CHAT_READ_COMMAND,
      globalTransitIdList: [],
      jsonMessage: jsonStringify64(request),
      recipients: recipients,
    },
    ChatDrive
  );
};

// export const DELETE_CHAT_COMMAND = 180;
// export interface DeleteRequest {
//   conversationId: string;
//   messageIds: string[];
// }

// Probably not needed, as the file is "updated" for a soft delete, which just is sent over transit to the recipients
// export const requestDelete = async (
//   dotYouClient: DotYouClient,
//   conversation: HomebaseFile<Conversation>,
//   chatGlobalTransitIds: string[]
// ) => {
//   const request: DeleteRequest = {
//     conversationId: conversation.fileMetadata.appData.uniqueId as string,
//     messageIds: chatGlobalTransitIds,
//   };

//   const conversationContent = conversation.fileMetadata.appData.content;
//   const recipients = (conversationContent as GroupConversation).recipients || [
//     (conversationContent as SingleConversation).recipient,
//   ];
//   if (!recipients?.filter(Boolean)?.length)
//     throw new Error('No recipients found in the conversation');

//   return await sendCommand(
//     dotYouClient,
//     {
//       code: DELETE_CHAT_COMMAND,
//       globalTransitIdList: [],
//       jsonMessage: jsonStringify64(request),
//       recipients: recipients,
//     },
//     ChatDrive
//   );
// };
