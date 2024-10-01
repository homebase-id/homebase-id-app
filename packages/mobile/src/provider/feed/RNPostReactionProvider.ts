import {
  DEFAULT_PAYLOAD_KEY,
  DotYouClient,
  EmbeddedThumb,
  HomebaseFile,
  ImageContentType,
  NewHomebaseFile,
  PayloadFile,
  PriorityOptions,
  ReactionFile,
  ScheduleOptions,
  SecurityGroupType,
  SendContents,
  ThumbnailFile,
  TransferUploadStatus,
  uploadFile,
  UploadFileMetadata,
  UploadInstructionSet,
} from '@homebase-id/js-lib/core';
import {
  jsonStringify64,
  stringToUint8Array,
  getNewId,
  getRandom16ByteArray,
} from '@homebase-id/js-lib/helpers';

import {
  TransitInstructionSet,
  TransitUploadResult,
  uploadFileOverPeer,
} from '@homebase-id/js-lib/peer';
import {
  GetTargetDriveFromChannelId,
  ReactionConfig,
  ReactionContext,
} from '@homebase-id/js-lib/public';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { createThumbnails } from '../image/RNThumbnailProvider';
import { ImageSource } from '../image/RNImageProvider';

const COMMENT_MEDIA_PAYLOAD = 'cmmnt_md';

export interface RawReactionContent extends Omit<ReactionFile, 'attachments'> {
  attachment?: ImageSource;
}

/* Adding a comment might fail if the referencedFile isn't available anymore (ACL got updates, post got deleted...) */
export const saveComment = async (
  dotYouClient: DotYouClient,
  context: ReactionContext,
  comment:
    | Omit<NewHomebaseFile<RawReactionContent>, 'serverMetadata'>
    | HomebaseFile<RawReactionContent>
): Promise<string> => {
  const encrypt = context.target.isEncrypted;
  const isLocal = context.odinId === dotYouClient.getIdentity();
  const targetDrive = GetTargetDriveFromChannelId(context.channelId);

  const payloads: PayloadFile[] = [];
  const thumbnails: ThumbnailFile[] = [];
  let previewThumbnail: EmbeddedThumb | undefined;

  if (comment.fileMetadata.appData.content.attachment) {
    const imageFile = comment.fileMetadata.appData.content.attachment;
    const newMediaFile = new OdinBlob(imageFile.filepath || imageFile.uri, {
      type: imageFile?.type || undefined,
    }) as unknown as Blob;
    const { additionalThumbnails, tinyThumb } = await createThumbnails(
      imageFile,
      COMMENT_MEDIA_PAYLOAD,
      imageFile.type as ImageContentType,
      [
        { height: 250, width: 250, quality: 100 },
        { height: 1600, width: 1600, quality: 100 },
      ]
    );

    thumbnails.push(...additionalThumbnails);
    payloads.push({ payload: newMediaFile, key: COMMENT_MEDIA_PAYLOAD });
    previewThumbnail = tinyThumb;

    delete comment.fileMetadata.appData.content.attachment;
    comment.fileMetadata.appData.content.mediaPayloadKey = COMMENT_MEDIA_PAYLOAD;
  }

  const payloadJson: string = jsonStringify64(comment.fileMetadata.appData.content);
  const payloadBytes = stringToUint8Array(payloadJson);

  // Set max of 3kb for content so enough room is left for metadata
  const shouldEmbedContent = payloadBytes.length < 3000;
  const metadata: UploadFileMetadata = {
    // allowDistribution: true, // Disable
    versionTag: comment.fileMetadata.versionTag,
    allowDistribution: false,
    senderOdinId: comment.fileMetadata.appData.content.authorOdinId,
    referencedFile: {
      targetDrive,
      globalTransitId: comment.fileMetadata.appData.groupId || context.target.globalTransitId,
    },
    appData: {
      tags: [],
      uniqueId: comment.fileMetadata.appData.uniqueId ?? getNewId(),
      fileType: ReactionConfig.CommentFileType,
      content: shouldEmbedContent ? payloadJson : undefined,
      previewThumbnail: previewThumbnail,
      userDate: comment.fileMetadata.appData.userDate ?? new Date().getTime(),
    },
    isEncrypted: encrypt,
    accessControlList: {
      requiredSecurityGroup: encrypt ? SecurityGroupType.Connected : SecurityGroupType.Anonymous,
    },
  };

  if (!shouldEmbedContent) {
    payloads.push({
      payload: new OdinBlob([payloadBytes], { type: 'application/json' }) as unknown as Blob,
      key: DEFAULT_PAYLOAD_KEY,
    });
  }

  if (isLocal) {
    const instructionSet: UploadInstructionSet = {
      transferIv: getRandom16ByteArray(),
      storageOptions: {
        overwriteFileId: comment.fileId || undefined,
        drive: targetDrive,
      },
      transitOptions: {
        recipients: [],
        schedule: ScheduleOptions.SendLater,
        priority: PriorityOptions.Medium,
        sendContents: SendContents.All,
      },
      systemFileType: 'Comment',
    };

    // Use owner/youauth endpoint for reactions if the post to comment on is on the current root identity
    const result = await uploadFile(
      dotYouClient,
      instructionSet,
      metadata,
      payloads,
      thumbnails,
      encrypt
    );
    if (!result) throw new Error('Upload failed');

    return result.globalTransitIdFileIdentifier.globalTransitId;
  } else {
    metadata.referencedFile = {
      targetDrive: targetDrive,
      globalTransitId: comment.fileMetadata.appData.groupId || context.target.globalTransitId,
    };
    metadata.accessControlList = { requiredSecurityGroup: SecurityGroupType.Connected };
    metadata.allowDistribution = true;

    const instructionSet: TransitInstructionSet = {
      transferIv: getRandom16ByteArray(),
      overwriteGlobalTransitFileId: (comment as HomebaseFile<ReactionFile>).fileMetadata
        .globalTransitId,
      remoteTargetDrive: targetDrive,
      schedule: ScheduleOptions.SendLater,
      priority: PriorityOptions.Medium,
      recipients: [context.odinId],
      systemFileType: 'Comment',
    };

    const result: TransitUploadResult = await uploadFileOverPeer(
      dotYouClient,
      instructionSet,
      metadata,
      payloads,
      thumbnails,
      encrypt
    );

    if (
      TransferUploadStatus.EnqueuedFailed === result.recipientStatus[context.odinId].toLowerCase()
    ) {
      throw new Error(result.recipientStatus[context.odinId].toString());
    }

    return result.remoteGlobalTransitIdFileIdentifier.globalTransitId;
  }
};
