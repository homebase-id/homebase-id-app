import {
  AppFileMetaData,
  DotYouClient,
  HomebaseFile,
  EmbeddedThumb,
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
  getFileHeaderByUniqueId,
  queryBatch,
  uploadFile,
  TransferUploadStatus,
  FailedTransferStatuses,
  PriorityOptions,
  RecipientTransferHistory,
  TransferStatus,
  deleteFile,
  RichText,
  decryptKeyHeader,
  EncryptedKeyHeader,
  decryptJsonContent,
  getFileHeader,
  DEFAULT_PAYLOAD_KEY,
  RecipientTransferSummary,
  MAX_HEADER_CONTENT_BYTES,
  patchFile,
  UpdateResult,
  UpdateLocalInstructionSet,
} from '@homebase-id/js-lib/core';
import {
  ChatDrive,
  ConversationMetadata,
  ConversationWithYourselfId,
  UnifiedConversation,
} from './ConversationProvider';
import {
  assertIfDefined,
  getNewId,
  getRandom16ByteArray,
  jsonStringify64,
  stringGuidsEqual,
  stringToUint8Array,
  tryJsonParse,
  uint8ArrayToBase64,
} from '@homebase-id/js-lib/helpers';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { ImageSource } from '../image/RNImageProvider';
import { createThumbnails } from '../image/RNThumbnailProvider';
import { processVideo } from '../video/RNVideoProcessor';
import { LinkPreview, LinkPreviewDescriptor } from '@homebase-id/js-lib/media';
import { sendReadReceipt } from '@homebase-id/js-lib/peer';
import { ellipsisAtMaxChar, getPlainTextFromRichText } from 'homebase-id-app-common';

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
  replyId?: string;

  /// Content of the message
  message: string | RichText;

  /// DeliveryStatus of the message. Indicates if the message is sent, delivered or read
  deliveryStatus: ChatDeliveryStatus;
  isEdited?: boolean;
}

const CHAT_MESSAGE_PAYLOAD_KEY = 'chat_mbl';
export const CHAT_LINKS_PAYLOAD_KEY = 'chat_links';

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
    includeTransferHistory: true,
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
    const msgContent = await (async () => {
      const { fileId, fileMetadata, sharedSecretEncryptedKeyHeader } = dsr;
      if (!fileId || !fileMetadata) {
        throw new Error('[chat-provider] dsrToMessage: fileId or fileMetadata is undefined');
      }
      if (fileMetadata.isEncrypted && !sharedSecretEncryptedKeyHeader) return null;

      const keyHeader = fileMetadata.isEncrypted
        ? await decryptKeyHeader(dotYouClient, sharedSecretEncryptedKeyHeader as EncryptedKeyHeader)
        : undefined;
      let decryptedJsonContent: string | null = null;
      if (includeMetadataHeader) {
        decryptedJsonContent = await decryptJsonContent(fileMetadata, keyHeader);
      } else {
        // When contentIsComplete but includeMetadataHeader == false the query before was done without including the content; So we just get and parse
        const fileHeader = await getFileHeader(dotYouClient, targetDrive, fileId);
        if (!fileHeader) return null;
        decryptedJsonContent = await decryptJsonContent(fileHeader.fileMetadata, keyHeader);
      }
      return tryJsonParse<ChatMessage>(decryptedJsonContent);
    })();

    if (!msgContent) return null;

    if (
      msgContent.deliveryStatus === ChatDeliveryStatus.Sent ||
      msgContent.deliveryStatus === ChatDeliveryStatus.Failed
    ) {
      if (
        dsr.serverMetadata?.transferHistory &&
        'recipients' in dsr.serverMetadata.transferHistory
      ) {
        msgContent.deliveryStatus = buildDeliveryStatusBasedOnDeprecatedDeliveryDetails(
          buildDeprecatedDeliveryDetails(
            dsr.serverMetadata.transferHistory.recipients as {
              [key: string]: RecipientTransferHistory;
            }
          )
        );
      } else if (dsr.serverMetadata?.transferHistory?.summary) {
        msgContent.deliveryStatus = stringGuidsEqual(
          dsr.fileMetadata.appData.groupId,
          ConversationWithYourselfId
        )
          ? ChatDeliveryStatus.Read
          : buildDeliveryStatus(
            dsr.serverMetadata.originalRecipientCount,
            dsr.serverMetadata.transferHistory.summary
          );
      }
    }

    const chatMessage: HomebaseFile<ChatMessage> = {
      ...dsr,
      fileMetadata: {
        ...dsr.fileMetadata,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        originalAuthor: dsr.fileMetadata.originalAuthor || (msgContent as any)?.authorOdinId,
        appData: {
          ...dsr.fileMetadata.appData,
          content: msgContent,
        },
      },
    };

    return chatMessage;
  } catch (ex) {
    console.error('[chat-rn] failed to get the chatMessage payload of a dsr', dsr, ex);
    return null;
  }
};

/**
 * @deprecated Use buildDeliveryStatus instead
 */
const buildDeprecatedDeliveryDetails = (recipientTransferHistory: {
  [key: string]: RecipientTransferHistory;
}): Record<string, ChatDeliveryStatus> => {
  const deliveryDetails: Record<string, ChatDeliveryStatus> = {};

  for (const recipient of Object.keys(recipientTransferHistory)) {
    if (recipientTransferHistory[recipient].latestSuccessfullyDeliveredVersionTag) {
      if (recipientTransferHistory[recipient].isReadByRecipient) {
        deliveryDetails[recipient] = ChatDeliveryStatus.Read;
      } else {
        deliveryDetails[recipient] = ChatDeliveryStatus.Delivered;
      }
    } else {
      const latest = recipientTransferHistory[recipient].latestTransferStatus;
      const transferStatus =
        latest && typeof latest === 'string'
          ? (latest?.toLocaleLowerCase() as TransferStatus)
          : undefined;
      if (transferStatus && FailedTransferStatuses.includes(transferStatus)) {
        deliveryDetails[recipient] = ChatDeliveryStatus.Failed;
      } else {
        deliveryDetails[recipient] = ChatDeliveryStatus.Sent;
      }
    }
  }

  return deliveryDetails;
};

/**
 * @deprecated Use buildDeliveryStatus instead
 */
const buildDeliveryStatusBasedOnDeprecatedDeliveryDetails = (
  deliveryDetails: Record<string, ChatDeliveryStatus>
): ChatDeliveryStatus => {
  const values = Object.values(deliveryDetails);
  // If any failed, the message is failed
  if (values.includes(ChatDeliveryStatus.Failed)) return ChatDeliveryStatus.Failed;
  // If all are delivered/read, the message is delivered/read
  if (values.every((val) => val === ChatDeliveryStatus.Read)) return ChatDeliveryStatus.Read;
  if (
    values.every((val) => val === ChatDeliveryStatus.Delivered || val === ChatDeliveryStatus.Read)
  ) {
    return ChatDeliveryStatus.Delivered;
  }

  // If it exists, it's sent
  return ChatDeliveryStatus.Sent;
};

export const transferHistoryToChatDeliveryStatus = (
  transferHistory: RecipientTransferHistory | undefined
): ChatDeliveryStatus => {
  if (!transferHistory) return ChatDeliveryStatus.Failed;

  if (transferHistory.latestSuccessfullyDeliveredVersionTag) {
    if (transferHistory.isReadByRecipient) {
      return ChatDeliveryStatus.Read;
    } else {
      return ChatDeliveryStatus.Delivered;
    }
  }

  const latest = transferHistory.latestTransferStatus;
  const transferStatus =
    latest && typeof latest === 'string'
      ? (latest?.toLocaleLowerCase() as TransferStatus)
      : undefined;
  if (transferStatus && FailedTransferStatuses.includes(transferStatus)) {
    return ChatDeliveryStatus.Failed;
  }
  return ChatDeliveryStatus.Sent;
};

export const buildDeliveryStatus = (
  recipientCount: number | undefined,
  transferSummary: RecipientTransferSummary
): ChatDeliveryStatus => {
  if (transferSummary.totalFailed > 0) return ChatDeliveryStatus.Failed;

  if (transferSummary.totalReadByRecipient >= (recipientCount || 0)) return ChatDeliveryStatus.Read;
  if (transferSummary.totalDelivered >= (recipientCount || 0)) return ChatDeliveryStatus.Delivered;

  return ChatDeliveryStatus.Sent;
};

export const uploadChatMessage = async (
  dotYouClient: DotYouClient,
  message: NewHomebaseFile<ChatMessage>,
  recipients: string[],
  files: ImageSource[] | undefined,
  linkPreviews: LinkPreview[] | undefined,
  notificationBody?: string,
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
        schedule: ScheduleOptions.SendLater,
        priority: PriorityOptions.High,
        sendContents: SendContents.All,
        useAppNotification: true,
        appNotificationOptions: {
          appId: CHAT_APP_ID,
          typeId: message.fileMetadata.appData.groupId || getNewId(),
          tagId: message.fileMetadata.appData.uniqueId || getNewId(),
          silent: false,
          unEncryptedMessage: notificationBody,
        },
      }
      : undefined,
  };

  const payloads: PayloadFile[] = [];
  const thumbnails: ThumbnailFile[] = [];
  const previewThumbnails: EmbeddedThumb[] = [];
  const aesKey: Uint8Array | undefined = getRandom16ByteArray();

  const jsonContent: string = jsonStringify64({ ...messageContent });
  const payloadBytes = stringToUint8Array(jsonStringify64({ message: messageContent.message }));

  // Set max of 3kb for content so enough room is left for metadata
  const shouldEmbedContent = payloadBytes.length < 3000;
  const content = shouldEmbedContent
    ? jsonContent
    : jsonStringify64({
      message: ellipsisAtMaxChar(getPlainTextFromRichText(messageContent.message), 400),
      replyId: messageContent.replyId,
      deliveryStatus: messageContent.deliveryStatus,
    }); // We only embed the content if it's less than 3kb

  if (!shouldEmbedContent) {
    payloads.push({
      key: DEFAULT_PAYLOAD_KEY,
      payload: new OdinBlob([payloadBytes], { type: 'application/json' }) as unknown as Blob,
    });
  }

  const uploadMetadata: UploadFileMetadata = {
    versionTag: message?.fileMetadata.versionTag,
    allowDistribution: distribute,
    appData: {
      uniqueId: message.fileMetadata.appData.uniqueId,
      groupId: message.fileMetadata.appData.groupId,
      userDate: message.fileMetadata.appData.userDate,
      fileType: CHAT_MESSAGE_FILE_TYPE,
      content: content,
    },
    isEncrypted: true,
    accessControlList: message.serverMetadata?.accessControlList || {
      requiredSecurityGroup: SecurityGroupType.Connected,
    },
  };

  if ((!files || files.length === 0) && linkPreviews?.length) {
    // We only support link previews when there is no media
    const descriptorContent = JSON.stringify(
      linkPreviews.map((preview) => {
        return {
          url: preview.url,
          hasImage: !!preview.imageUrl,
          imageWidth: preview.imageWidth,
          imageHeight: preview.imageHeight,
        } as LinkPreviewDescriptor;
      })
    );

    const linkPreviewWithImage = linkPreviews.find((preview) => preview.imageUrl);

    const imageSource: ImageSource | undefined = linkPreviewWithImage
      ? {
        height: linkPreviewWithImage.imageHeight || 0,
        width: linkPreviewWithImage.imageWidth || 0,
        uri: linkPreviewWithImage.imageUrl,
      }
      : undefined;

    const { tinyThumb } = imageSource
      ? await createThumbnails(imageSource, '')
      : { tinyThumb: undefined };

    payloads.push({
      key: CHAT_LINKS_PAYLOAD_KEY,
      payload: new OdinBlob([stringToUint8Array(JSON.stringify(linkPreviews))], {
        type: 'application/json',
      }) as unknown as Blob,
      descriptorContent,
      previewThumbnail: tinyThumb,
    });
  }

  for (let i = 0; files && i < files?.length; i++) {
    const payloadKey = `${CHAT_MESSAGE_PAYLOAD_KEY}${i}`;
    const newMediaFile = files[i];

    if (newMediaFile.type?.startsWith('video/')) {
      const {
        tinyThumb: tinyThumbFromVideo,
        thumbnails: thumbnailsFromVideo,
        payloads: payloadsFromVideo,
      } = await processVideo(newMediaFile, payloadKey, true, onUpdate, aesKey);

      thumbnails.push(...thumbnailsFromVideo);
      payloads.push(...payloadsFromVideo);

      if (tinyThumbFromVideo) previewThumbnails.push(tinyThumbFromVideo);
    } else if (newMediaFile.type?.startsWith('image/')) {
      onUpdate?.('Generating thumbnails', 0);

      const blob = new OdinBlob(newMediaFile.filepath || newMediaFile.uri, {
        type: newMediaFile?.type || undefined,
      }) as unknown as Blob;

      const { additionalThumbnails, tinyThumb } = await createThumbnails(
        newMediaFile,
        payloadKey,
        (newMediaFile?.type as ImageContentType) || undefined,
        [
          { quality: 84, maxPixelDimension: 320, maxBytes: 26 * 1024 },
          { quality: 76, maxPixelDimension: 1600, maxBytes: 640 * 1024 },
        ]
      );


      thumbnails.push(...additionalThumbnails);
      payloads.push({
        key: payloadKey,
        payload: blob,
        descriptorContent: newMediaFile?.filename || newMediaFile?.type || undefined,
        previewThumbnail: tinyThumb,
      });

      if (tinyThumb) previewThumbnails.push(tinyThumb);
    } else if (newMediaFile.type?.startsWith('audio')) {
      const payloadBlob = new OdinBlob(newMediaFile.filepath || newMediaFile.uri, {
        type: newMediaFile.type,
      }) as unknown as Blob;

      const descriptorContent = JSON.stringify({
        duration: newMediaFile.playableDuration,
        filename: newMediaFile.filename,
      });

      payloads.push({
        key: payloadKey,
        payload: payloadBlob,
        descriptorContent: descriptorContent,
      });
    } else {
      if (newMediaFile?.type) {
        const payloadBlob = new OdinBlob(newMediaFile.filepath || newMediaFile.uri, {
          type: newMediaFile.type,
        }) as unknown as Blob;

        payloads.push({
          key: payloadKey,
          payload: payloadBlob,
          descriptorContent: newMediaFile?.filename || newMediaFile?.type || undefined,
        });
      }
    }
  }

  uploadMetadata.appData.previewThumbnail = previewThumbnails[0];
  onUpdate?.('Uploading', 0);

  const uploadResult = await uploadFile(
    dotYouClient,
    uploadInstructions,
    uploadMetadata,
    payloads,
    thumbnails,
    undefined,
    onVersionConflict,
    {
      axiosConfig: {
        onUploadProgress: (progress) => onUpdate?.('Uploading', progress.progress || 0),
      },
      aesKey,
    }
  );

  if (!uploadResult) {
    throw new Error('Failed to upload chat message');
  }

  if (
    uploadResult.recipientStatus &&
    Object.values(uploadResult.recipientStatus).some(
      (recipienStatus) => recipienStatus.toLowerCase() === TransferUploadStatus.EnqueuedFailed
    )
  ) {
    message.fileId = uploadResult.file.fileId;
    message.fileMetadata.versionTag = uploadResult.newVersionTag;
    message.fileMetadata.appData.content.deliveryStatus = ChatDeliveryStatus.Failed;

    const updateResult = await updateChatMessage(
      dotYouClient,
      message,
      recipients,
      uploadResult.keyHeader
    );
    console.warn('Not all recipients received the message: ', uploadResult);
    // We don't throw an error as it is not a critical failure; And the message is still saved locally
    return {
      ...uploadResult,
      newVersionTag: updateResult?.newVersionTag || uploadResult?.newVersionTag,
      previewThumbnail: uploadMetadata.appData.previewThumbnail,
      chatDeliveryStatus: ChatDeliveryStatus.Failed, // Should we set failed, or does an enqueueFailed have a retry? (Either way it should auto-solve if it does)
    };
  }

  return {
    ...uploadResult,
    previewThumbnail: uploadMetadata.appData.previewThumbnail,
    chatDeliveryStatus: ChatDeliveryStatus.Sent,
  };
};

export const updateChatMessage = async (
  dotYouClient: DotYouClient,
  message: HomebaseFile<ChatMessage> | NewHomebaseFile<ChatMessage>,
  recipients: string[],
  keyHeader?: KeyHeader
): Promise<UpdateResult | void> => {
  const messageContent = message.fileMetadata.appData.content;
  const distribute = recipients?.length > 0;

  if (!message.fileId) throw new Error('Message does not have a fileId');
  const uploadInstructions: UpdateLocalInstructionSet = {
    file: {
      fileId: message.fileId,
      targetDrive: ChatDrive,
    },
    recipients: distribute ? [...recipients] : undefined,
    versionTag: message.fileMetadata.versionTag,
    locale: 'local',
  };

  const jsonContent: string = jsonStringify64({ ...messageContent });
  const payloadBytes = stringToUint8Array(jsonStringify64({ message: messageContent.message }));

  // Set max of 3kb for content so enough room is left for metadata
  const shouldEmbedContent = uint8ArrayToBase64(payloadBytes).length < MAX_HEADER_CONTENT_BYTES;

  const content = shouldEmbedContent
    ? jsonContent
    : jsonStringify64({
      message: ellipsisAtMaxChar(getPlainTextFromRichText(messageContent.message), 400),
      replyId: messageContent.replyId,
      deliveryStatus: messageContent.deliveryStatus,
    }); // We only embed the content if it's less than 3kb

  const payloads: PayloadFile[] = [];
  if (!shouldEmbedContent) {
    payloads.push({
      key: DEFAULT_PAYLOAD_KEY,
      payload: new OdinBlob([payloadBytes], { type: 'application/json' }) as unknown as Blob,
    });
  }

  const uploadMetadata: UploadFileMetadata = {
    versionTag: message?.fileMetadata.versionTag,
    allowDistribution: distribute,
    appData: {
      uniqueId: message.fileMetadata.appData.uniqueId,
      groupId: message.fileMetadata.appData.groupId,
      archivalStatus: (message.fileMetadata.appData as AppFileMetaData<ChatMessage>).archivalStatus,
      previewThumbnail: message.fileMetadata.appData.previewThumbnail,
      fileType: CHAT_MESSAGE_FILE_TYPE,
      content: content,
    },
    isEncrypted: true,
    accessControlList: message.serverMetadata?.accessControlList || {
      requiredSecurityGroup: SecurityGroupType.Connected,
    },
  };

  return await patchFile(
    dotYouClient,
    keyHeader || (message as HomebaseFile<ChatMessage>).sharedSecretEncryptedKeyHeader,
    uploadInstructions,
    uploadMetadata,
    payloads,
    undefined,
    undefined,
    async () => {
      const existingChatMessage = await getChatMessage(
        dotYouClient,
        message.fileMetadata.appData.uniqueId as string
      );
      if (!existingChatMessage) return;
      message.fileMetadata.versionTag = existingChatMessage.fileMetadata.versionTag;
      return await updateChatMessage(dotYouClient, message, recipients, keyHeader);
    }
  );
};

export const hardDeleteChatMessage = async (
  dotYouClient: DotYouClient,
  message: HomebaseFile<ChatMessage>
) => {
  return await deleteFile(dotYouClient, ChatDrive, message.fileId, []);
};

export const softDeleteChatMessage = async (
  dotYouClient: DotYouClient,
  message: HomebaseFile<ChatMessage>,
  recipients: string[],
  deleteForEveryone?: boolean
) => {
  const _recipients = deleteForEveryone ? recipients : [];

  message.fileMetadata.appData.archivalStatus = ChatDeletedArchivalStaus;
  message.fileMetadata.appData.content.message = '';

  const uploadMetadata: UploadFileMetadata = {
    versionTag: message?.fileMetadata.versionTag,
    allowDistribution: _recipients && _recipients.length > 0,
    appData: {
      uniqueId: message.fileMetadata.appData.uniqueId,
      groupId: message.fileMetadata.appData.groupId,
      archivalStatus: (message.fileMetadata.appData as AppFileMetaData<ChatMessage>).archivalStatus,
      previewThumbnail: message.fileMetadata.appData.previewThumbnail,
      fileType: CHAT_MESSAGE_FILE_TYPE,
      content: jsonStringify64({ ...message.fileMetadata.appData.content }),
    },
    isEncrypted: true,
    accessControlList: message.serverMetadata?.accessControlList || {
      requiredSecurityGroup: SecurityGroupType.AutoConnected,
    },
  };

  return await patchFile(
    dotYouClient,
    message.sharedSecretEncryptedKeyHeader,
    {
      file: {
        fileId: message.fileId,
        targetDrive: ChatDrive,
      },
      locale: 'local',
      recipients: _recipients,
      versionTag: message.fileMetadata.versionTag,
      systemFileType: message.fileSystemType,
    },
    uploadMetadata,
    [],
    [],
    message.fileMetadata.payloads // Delete all payloads
  );
};

export const requestMarkAsRead = async (
  dotYouClient: DotYouClient,
  conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>,
  messages: HomebaseFile<ChatMessage>[]
) => {
  const chatFileIds = messages
    .filter(
      (msg) =>
        msg.fileMetadata.appData.content.deliveryStatus !== ChatDeliveryStatus.Read &&
        msg.fileMetadata.senderOdinId &&
        msg.fileMetadata.senderOdinId !== dotYouClient.getLoggedInIdentity()
    )
    .map((msg) => msg.fileId) as string[];

  return sendReadReceipt(dotYouClient, ChatDrive, chatFileIds);
};
