import {
  DotYouClient,
  HomebaseFile,
  FileQueryParams,
  GetBatchQueryResultOptions,
  NewHomebaseFile,
  SecurityGroupType,
  TargetDrive,
  UploadFileMetadata,
  UploadInstructionSet,
  getContentFromHeaderOrPayload,
  getFileHeaderByUniqueId,
  queryBatch,
  uploadFile,
  uploadHeader,
  EncryptedKeyHeader,
  ScheduleOptions,
  SendContents,
  UploadResult,
  PriorityOptions,
  PayloadFile,
  ThumbnailFile,
  EmbeddedThumb,
  ImageContentType,
  UpdateHeaderInstructionSet,
} from '@homebase-id/js-lib/core';
import { jsonStringify64, stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { ImageSource } from '../image/RNImageProvider';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { createThumbnails } from '../image/RNThumbnailProvider';

export const CHAT_CONVERSATION_FILE_TYPE = 8888;
export const CHAT_CONVERSATION_LOCAL_METADATA_FILE_TYPE = 8889;
export const ConversationWithYourselfId = 'e4ef2382-ab3c-405d-a8b5-ad3e09e980dd';
export const CONVERSATION_PAYLOAD_KEY = 'convo_pk';

export const ConversationWithYourself: HomebaseFile<UnifiedConversation> = {
  fileState: 'active',
  fileId: '',
  fileSystemType: 'Standard',
  fileMetadata: {
    created: 0,
    updated: 0,
    isEncrypted: false,
    senderOdinId: '',
    originalAuthor: '',
    appData: {
      uniqueId: ConversationWithYourselfId,
      fileType: CHAT_CONVERSATION_FILE_TYPE,
      dataType: 0,
      content: {
        title: 'You',
        recipients: [],
      },
    },
    versionTag: '',
    payloads: [],
  },
  serverMetadata: undefined,
  priority: 0,
  sharedSecretEncryptedKeyHeader: {} as EncryptedKeyHeader,
};

export const ChatDrive: TargetDrive = {
  alias: '9ff813aff2d61e2f9b9db189e72d1a11',
  type: '66ea8355ae4155c39b5a719166b510e3',
};

interface BaseConversation {
  title: string;
}

export interface UnifiedConversation extends BaseConversation {
  recipients: string[];
}

/**
 * @deprecated The SingleConversation type is deprecated. Use the UnifiedConversation type instead.
 */
export interface SingleConversation extends BaseConversation {
  recipient: string;
}

/**
 * @deprecated The GroupConversation type is deprecated. Use the UnifiedConversation type instead.
 */
export interface GroupConversation extends BaseConversation {
  recipients: string[];
}

/**
 * @deprecated The SingleConversation & GroupConversation types are deprecated. Use the UnifiedConversation type instead.
 */
export type Conversation = SingleConversation | GroupConversation;

export const getConversations = async (
  dotYouClient: DotYouClient,
  cursorState: string | undefined,
  pageSize: number
) => {
  const params: FileQueryParams = {
    targetDrive: ChatDrive,
    fileType: [CHAT_CONVERSATION_FILE_TYPE],
  };

  const ro: GetBatchQueryResultOptions = {
    maxRecords: pageSize,
    cursorState: cursorState,
    includeMetadataHeader: true,
  };

  const response = await queryBatch(dotYouClient, params, ro);

  if (!response) return null;

  return {
    ...response,
    searchResults:
      ((await Promise.all(
        response.searchResults
          .map(async (result) => await dsrToConversation(dotYouClient, result, ChatDrive, true))
          .filter(Boolean)
      )) as HomebaseFile<UnifiedConversation>[]) || [],
  };
};

export const getConversation = async (dotYouClient: DotYouClient, conversationId: string) => {
  if (conversationId === ConversationWithYourselfId) return ConversationWithYourself;

  const conversationHeader = await getFileHeaderByUniqueId<Conversation>(
    dotYouClient,
    ChatDrive,
    conversationId
  );
  if (!conversationHeader) return null;

  const unified: HomebaseFile<UnifiedConversation> = {
    ...conversationHeader,
    fileMetadata: {
      ...conversationHeader.fileMetadata,
      appData: {
        ...conversationHeader.fileMetadata.appData,
        content: {
          ...conversationHeader.fileMetadata.appData.content,
          recipients: (conversationHeader.fileMetadata.appData.content as GroupConversation)
            .recipients || [
            (conversationHeader.fileMetadata.appData.content as SingleConversation).recipient,
            dotYouClient.getIdentity(),
          ],
        },
      },
    },
  };

  return unified;
};

export const dsrToConversation = async (
  dotYouClient: DotYouClient,
  dsr: HomebaseFile,
  targetDrive: TargetDrive,
  includeMetadataHeader: boolean
): Promise<HomebaseFile<UnifiedConversation> | null> => {
  try {
    const attrContent = await getContentFromHeaderOrPayload<Conversation>(
      dotYouClient,
      targetDrive,
      dsr,
      includeMetadataHeader
    );
    if (!attrContent) return null;

    const identity = dotYouClient.getIdentity();
    const conversation: HomebaseFile<UnifiedConversation> = {
      ...dsr,
      fileMetadata: {
        ...dsr.fileMetadata,
        appData: {
          ...dsr.fileMetadata.appData,
          content: {
            ...attrContent,
            recipients: (attrContent as GroupConversation).recipients
              ? [
                  ...(attrContent as GroupConversation).recipients.filter(
                    (recipient) => recipient !== identity
                  ),
                  identity,
                ]
              : [(attrContent as SingleConversation).recipient, identity],
          },
        },
      },
    };

    return conversation;
  } catch (ex) {
    console.error('[chat-rn] failed to get the conversation payload of a dsr', dsr, ex);
    return null;
  }
};

export const uploadConversation = async (
  dotYouClient: DotYouClient,
  conversation: NewHomebaseFile<UnifiedConversation>,
  distribute = false,
  image?: ImageSource,
  onVersionConflict?: () => void
) => {
  const identity = dotYouClient.getIdentity();
  const uploadInstructions: UploadInstructionSet = {
    storageOptions: {
      drive: ChatDrive,
      overwriteFileId: conversation.fileId,
    },
    transitOptions: distribute
      ? {
          recipients: conversation.fileMetadata.appData.content.recipients.filter(
            (recipient) => recipient !== identity
          ),
          schedule: ScheduleOptions.SendLater,
          priority: PriorityOptions.Medium,
          sendContents: SendContents.All,
        }
      : undefined,
  };

  const conversationContent = conversation.fileMetadata.appData.content;
  const payloadJson: string = jsonStringify64({ ...conversationContent, version: 1 });

  const uploadMetadata: UploadFileMetadata = {
    versionTag: conversation?.fileMetadata.versionTag,
    allowDistribution: distribute,
    appData: {
      uniqueId: conversation.fileMetadata.appData.uniqueId,
      fileType: conversation.fileMetadata.appData.fileType || CHAT_CONVERSATION_FILE_TYPE,
      content: payloadJson,
    },
    isEncrypted: true,
    accessControlList: conversation.serverMetadata?.accessControlList || {
      requiredSecurityGroup: SecurityGroupType.Owner,
    },
  };

  const payloads: PayloadFile[] = [];
  const thumbnails: ThumbnailFile[] = [];
  const previewThumbnails: EmbeddedThumb[] = [];

  if (image) {
    const blob = new OdinBlob(image.filepath || image.uri, {
      type: image?.type || undefined,
    }) as unknown as Blob;

    const { additionalThumbnails, tinyThumb } = await createThumbnails(
      image,
      CONVERSATION_PAYLOAD_KEY,
      (image?.type as ImageContentType) || undefined,
      [
        { quality: 75, width: 250, height: 250 },
        { quality: 75, width: 1600, height: 1600 },
      ]
    );

    thumbnails.push(...additionalThumbnails);
    payloads.push({
      key: CONVERSATION_PAYLOAD_KEY,
      payload: blob,
      descriptorContent: image?.filename || image?.type || undefined,
    });

    if (tinyThumb) previewThumbnails.push(tinyThumb);
  }

  uploadMetadata.appData.previewThumbnail = previewThumbnails[0];

  return await uploadFile(
    dotYouClient,
    uploadInstructions,
    uploadMetadata,
    payloads,
    thumbnails,
    undefined,
    onVersionConflict
  );
};

export const updateConversation = async (
  dotYouClient: DotYouClient,
  conversation: HomebaseFile<UnifiedConversation>,
  distribute = false,
  ignoreConflict = false
): Promise<UploadResult | void> => {
  const identity = dotYouClient.getIdentity();
  const uploadInstructions: UpdateHeaderInstructionSet = {
    storageOptions: {
      drive: ChatDrive,
      overwriteFileId: conversation.fileId,
    },
    transitOptions: distribute
      ? {
          recipients: conversation.fileMetadata.appData.content.recipients.filter(
            (recipient) => recipient !== identity
          ),
          schedule: ScheduleOptions.SendLater,
          priority: PriorityOptions.Medium,
          sendContents: SendContents.All,
        }
      : undefined,
    storageIntent: 'header',
  };

  const conversationContent = conversation.fileMetadata.appData.content;
  const payloadJson: string = jsonStringify64({ ...conversationContent });

  const uploadMetadata: UploadFileMetadata = {
    versionTag: conversation?.fileMetadata.versionTag,
    allowDistribution: distribute,
    appData: {
      archivalStatus: conversation.fileMetadata.appData.archivalStatus,
      uniqueId: conversation.fileMetadata.appData.uniqueId,
      fileType: conversation.fileMetadata.appData.fileType || CHAT_CONVERSATION_FILE_TYPE,
      content: payloadJson,
    },
    isEncrypted: true,
    accessControlList: conversation.serverMetadata?.accessControlList || {
      requiredSecurityGroup: SecurityGroupType.Owner,
    },
  };

  return await uploadHeader(
    dotYouClient,
    conversation.sharedSecretEncryptedKeyHeader,
    uploadInstructions,
    uploadMetadata,
    !ignoreConflict
      ? async () => {
          const existingConversation = await getConversation(
            dotYouClient,
            conversation.fileMetadata.appData.uniqueId as string
          );
          if (!existingConversation) return;
          conversation.fileMetadata.versionTag = existingConversation.fileMetadata.versionTag;
          conversation.sharedSecretEncryptedKeyHeader =
            existingConversation.sharedSecretEncryptedKeyHeader;
          return updateConversation(dotYouClient, conversation, distribute, true);
        }
      : () => {
          // We just supress the warning; As we are ignoring the conflict following @param ignoreConflict
        }
  );
};

export const getConversationMetadata = async (
  dotYouClient: DotYouClient,
  conversationId: string
) => {
  if (conversationId === ConversationWithYourselfId) return null;

  const result = await queryBatch(
    dotYouClient,
    {
      fileType: [CHAT_CONVERSATION_LOCAL_METADATA_FILE_TYPE],
      tagsMatchAtLeastOne: [conversationId],
      targetDrive: ChatDrive,
    },
    { includeMetadataHeader: true, maxRecords: 2 }
  );

  if (!result || !result.searchResults?.length) return null;

  return dsrToConversationMetadata(dotYouClient, result.searchResults[0], ChatDrive, true);
};

export const dsrToConversationMetadata = async (
  dotYouClient: DotYouClient,
  dsr: HomebaseFile,
  targetDrive: TargetDrive,
  includeMetadataHeader: boolean
): Promise<HomebaseFile<ConversationMetadata> | null> => {
  try {
    const attrContent = await getContentFromHeaderOrPayload<ConversationMetadata>(
      dotYouClient,
      targetDrive,
      dsr,
      includeMetadataHeader
    );
    if (!attrContent) return null;

    const conversation: HomebaseFile<ConversationMetadata> = {
      ...dsr,
      fileMetadata: {
        ...dsr.fileMetadata,
        appData: {
          ...dsr.fileMetadata.appData,
          content: {
            ...attrContent,
          },
        },
      },
    };

    return conversation;
  } catch (ex) {
    console.error('[chat-rn] failed to get the ConversationMetadata of a dsr', dsr, ex);
    return null;
  }
};

export const uploadConversationMetadata = async (
  dotYouClient: DotYouClient,
  conversation: NewHomebaseFile<ConversationMetadata>,
  onVersionConflict?: () => void
) => {
  if (!conversation.fileMetadata.appData.tags) {
    throw new Error('ConversationMetadata must have tags');
  }

  if (
    !conversation.fileMetadata.appData.tags.some((tag) =>
      stringGuidsEqual(tag, conversation.fileMetadata.appData.content.conversationId)
    )
  ) {
    throw new Error('ConversationMetadata must have a tag that matches the conversationId');
  }

  const uploadInstructions: UploadInstructionSet = {
    storageOptions: {
      drive: ChatDrive,
      overwriteFileId: conversation.fileId,
    },
  };

  const conversationContent = conversation.fileMetadata.appData.content;
  const payloadJson: string = jsonStringify64({ ...conversationContent, version: 1 });

  const uploadMetadata: UploadFileMetadata = {
    versionTag: conversation?.fileMetadata.versionTag,
    allowDistribution: false,
    appData: {
      tags: conversation.fileMetadata.appData.tags,
      uniqueId: conversation.fileMetadata.appData.uniqueId,
      fileType: CHAT_CONVERSATION_LOCAL_METADATA_FILE_TYPE,
      content: payloadJson,
    },
    isEncrypted: true,
    accessControlList: {
      requiredSecurityGroup: SecurityGroupType.Owner,
    },
  };

  return await uploadFile(
    dotYouClient,
    uploadInstructions,
    uploadMetadata,
    undefined,
    undefined,
    undefined,
    onVersionConflict
  );
};
export interface ConversationMetadata {
  conversationId: string;
  lastReadTime?: number;
}

export const JOIN_CONVERSATION_COMMAND = 100;
export const JOIN_GROUP_CONVERSATION_COMMAND = 110;
// export const UPDATE_GROUP_CONVERSATION_COMMAND = 111;

export interface JoinConversationRequest {
  conversationId: string;
  title: string;
}

export interface JoinGroupConversationRequest extends JoinConversationRequest {
  recipients: string[];
}
