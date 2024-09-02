import {
  DotYouClient,
  HomebaseFile,
  NewHomebaseFile,
  MediaFile,
  PayloadFile,
  ThumbnailFile,
  EmbeddedThumb,
  TargetDrive,
  SecurityGroupType,
  UploadInstructionSet,
  ScheduleOptions,
  SendContents,
  DEFAULT_PAYLOAD_KEY,
  UploadFileMetadata,
  uploadFile,
  appendDataToFile,
  deletePayload,
  uploadHeader,
  getFileHeader,
  AppendInstructionSet,
  UploadResult,
  ImageContentType,
  PriorityOptions,
  KeyHeader,
} from '@homebase-id/js-lib/core';
import {
  toGuidId,
  getNewId,
  getRandom16ByteArray,
  stringGuidsEqual,
  jsonStringify64,
  stringToUint8Array,
} from '@homebase-id/js-lib/helpers';
import {
  PostContent,
  getPost,
  GetTargetDriveFromChannelId,
  getPostBySlug,
  BlogConfig,
  postTypeToDataType,
} from '@homebase-id/js-lib/public';
import { OdinBlob } from '../../../polyfills/OdinBlob';
import { ImageSource } from '../image/RNImageProvider';
import { createThumbnails } from '../image/RNThumbnailProvider';
import { grabThumbnail, processVideo } from '../image/RNVideoProviderSegmenter';
import { VideoContentType } from '@homebase-id/js-lib/media';
import { AxiosRequestConfig } from 'axios';

const POST_MEDIA_PAYLOAD_KEY = 'pst_mdi';

export const savePost = async <T extends PostContent>(
  dotYouClient: DotYouClient,
  file: HomebaseFile<T> | NewHomebaseFile<T>,
  channelId: string,
  toSaveFiles?: (ImageSource | MediaFile)[] | ImageSource[],
  onVersionConflict?: () => void,
  onUpdate?: (phase: string, progress: number) => void
): Promise<UploadResult> => {
  if (!file.fileMetadata.appData.content.id) {
    // The content id is set once, and then never updated to keep the permalinks correct at all times; Even when the slug changes
    file.fileMetadata.appData.content.id = file.fileMetadata.appData.content.slug
      ? toGuidId(file.fileMetadata.appData.content.slug)
      : getNewId();
  } else if (!file.fileId) {
    // Check if fileMetadata.appData.content.id exists and with which fileId
    file.fileId =
      (await getPost(dotYouClient, channelId, file.fileMetadata.appData.content.id))?.fileId ??
      undefined;
  }

  if (file.fileId) {
    return await updatePost(dotYouClient, file as HomebaseFile<T>, channelId, toSaveFiles);
  } else {
    if (toSaveFiles?.some((file) => 'fileKey' in file)) {
      throw new Error(
        'Cannot upload a new post with an existing media file. Use updatePost instead'
      );
    }
  }
  const newMediaFiles = toSaveFiles as ImageSource[];

  if (!file.fileMetadata.appData.content.authorOdinId) {
    file.fileMetadata.appData.content.authorOdinId = dotYouClient.getIdentity();
  }
  if (!file.serverMetadata?.accessControlList) throw 'ACL is required to save a post';

  // Delete embeddedPost of embeddedPost (we don't want to embed an embed)
  if (file.fileMetadata.appData.content.embeddedPost) {
    delete (file.fileMetadata.appData.content.embeddedPost as PostContent).embeddedPost;
  }

  const encrypt = !(
    file.serverMetadata?.accessControlList?.requiredSecurityGroup === SecurityGroupType.Anonymous ||
    file.serverMetadata?.accessControlList?.requiredSecurityGroup ===
      SecurityGroupType.Authenticated
  );

  const targetDrive = GetTargetDriveFromChannelId(channelId);

  const payloads: PayloadFile[] = [];
  const thumbnails: ThumbnailFile[] = [];
  const previewThumbnails: EmbeddedThumb[] = [];
  let keyHeader: KeyHeader | undefined;

  // Handle image files:
  for (let i = 0; newMediaFiles && i < newMediaFiles?.length; i++) {
    const newMediaFile = newMediaFiles[i];
    const payloadKey = newMediaFile.key || `${POST_MEDIA_PAYLOAD_KEY}${i}`;

    console.log('newMediaFile', newMediaFile);
    if (newMediaFile.type?.startsWith('video/')) {
      // Grab thumbnail
      onUpdate?.('Grabbing thumbnail', 0);
      const thumbnail = await grabThumbnail(newMediaFile);
      const thumbSource: ImageSource | null = thumbnail
        ? {
            uri: thumbnail.uri,
            width: 1920, //thumbnail.width || 1920,
            height: 1080, //thumbnail.height || 1080,
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

      if (tinyThumb) previewThumbnails.push(tinyThumb);

      // Process video
      const { metadata, ...videoData } = await processVideo(
        newMediaFile,
        true,
        (progress) => onUpdate?.('Compressing', progress),
        encrypt
      );

      if ('segments' in videoData) {
        console.log('HLS video', videoData);

        // HLS
        const { playlist, segments } = videoData;
        keyHeader = videoData.keyHeader;
        const playlistBlob = new OdinBlob(playlist.uri, {
          type: playlist.type as VideoContentType,
        }) as any as Blob;

        payloads.push({
          key: payloadKey,
          payload: playlistBlob,
          descriptorContent: jsonStringify64(metadata),
          skipEncryption: true,
        });

        for (let j = 0; j < segments.length; j++) {
          const segment = segments[j];
          const segmentBlob = new OdinBlob(segment.uri, {
            type: segment.type as VideoContentType,
          }) as any as Blob;

          payloads.push({
            // key: `${payloadKey}_seg${j}`, => TODO: This is not allowed by the server ATM
            key: `hls_seg${j}`,
            payload: segmentBlob,
            skipEncryption: true,
            descriptorContent: 'HLS-segment',
          });
        }

        console.log(
          'HLS video payloads',
          payloads.map((pyld) => (pyld.payload as any as OdinBlob).uri)
        );
      } else {
        // Custom blob to avoid reading and writing the file to disk again
        const payloadBlob = new OdinBlob(
          (videoData.video.filepath || videoData.video.uri) as string,
          {
            type: 'video/mp4' as VideoContentType,
          }
        ) as any as Blob;

        payloads.push({
          key: payloadKey,
          payload: payloadBlob,
          descriptorContent: metadata ? jsonStringify64(metadata) : undefined,
        });
      }
    } else if (newMediaFile.type?.startsWith('image/')) {
      onUpdate?.('Generating thumbnails', 0);

      const { additionalThumbnails, tinyThumb } = await createThumbnails(
        newMediaFile,
        payloadKey,
        (newMediaFile?.type as ImageContentType) || undefined
      );

      // Custom blob to avoid reading and writing the file to disk again
      const payloadBlob = new OdinBlob((newMediaFile.filepath || newMediaFile.uri) as string, {
        type: newMediaFile?.type || 'image/jpeg',
      }) as any as Blob;

      thumbnails.push(...additionalThumbnails);
      payloads.push({
        key: payloadKey,
        payload: payloadBlob,
        previewThumbnail: tinyThumb,
        descriptorContent: newMediaFile?.filename || newMediaFile?.type || undefined,
      });

      if (tinyThumb) previewThumbnails.push(tinyThumb);
    } else {
      // Custom blob to avoid reading and writing the file to disk again
      const payloadBlob = new OdinBlob((newMediaFile.filepath || newMediaFile.uri) as string, {
        type: newMediaFile.type || 'image/jpeg',
      }) as any as Blob;

      payloads.push({
        key: payloadKey,
        payload: payloadBlob,
        descriptorContent: newMediaFile.filename || newMediaFile.type || undefined,
      });
    }
  }

  // Don't force the primaryMediaFile on articles
  if (file.fileMetadata.appData.content.type !== 'Article') {
    file.fileMetadata.appData.content.primaryMediaFile = payloads[0]
      ? {
          fileId: undefined,
          fileKey: payloads[0].key,
          type: payloads[0].payload.type,
        }
      : undefined;
  }

  // const previewThumbnail: EmbeddedThumb | undefined =
  //   previewThumbnails?.length >= 2 ? await makeGrid(previewThumbnails) : previewThumbnails[0];
  //TODO: makeGrid not supported in RNApp so until the support is added, we will use the first thumbnail as preview thumbnail
  const previewThumbnail: EmbeddedThumb | undefined = previewThumbnails[0];

  onUpdate?.('Uploading', 0);

  return await uploadPost(
    dotYouClient,
    file,
    payloads,
    thumbnails,
    previewThumbnail,
    channelId,
    targetDrive,
    onVersionConflict,
    {
      axiosConfig: {
        onUploadProgress: (progress) => onUpdate?.('Uploading', progress.progress || 0),
      },
      keyHeader,
    }
  );
};

const uploadPost = async <T extends PostContent>(
  dotYouClient: DotYouClient,
  file: HomebaseFile<T> | NewHomebaseFile<T>,
  payloads: PayloadFile[],
  thumbnails: ThumbnailFile[],
  previewThumbnail: EmbeddedThumb | undefined,
  channelId: string,
  targetDrive: TargetDrive,
  onVersionConflict?: () => void,
  options?: {
    axiosConfig?: AxiosRequestConfig<any> | undefined;
    keyHeader?: KeyHeader | undefined;
  }
) => {
  const encrypt = !(
    file.serverMetadata?.accessControlList?.requiredSecurityGroup === SecurityGroupType.Anonymous ||
    file.serverMetadata?.accessControlList?.requiredSecurityGroup ===
      SecurityGroupType.Authenticated
  );

  const instructionSet: UploadInstructionSet = {
    transferIv: getRandom16ByteArray(),
    storageOptions: {
      overwriteFileId: file?.fileId ?? '',
      drive: targetDrive,
    },
    transitOptions: {
      recipients: [],
      schedule: ScheduleOptions.SendLater,
      priority: PriorityOptions.Medium,
      sendContents: SendContents.All, // TODO: Should this be header only?
    },
  };

  const existingPostWithThisSlug = await getPostBySlug(
    dotYouClient,
    channelId,
    file.fileMetadata.appData.content.slug ?? file.fileMetadata.appData.content.id
  );

  if (
    existingPostWithThisSlug &&
    !stringGuidsEqual(existingPostWithThisSlug?.fileId, file.fileId)
  ) {
    // There is clash with an existing slug
    file.fileMetadata.appData.content.slug = `${
      file.fileMetadata.appData.content.slug
    }-${new Date().getTime()}`;
  }

  const uniqueId = file.fileMetadata.appData.content.slug
    ? toGuidId(file.fileMetadata.appData.content.slug)
    : file.fileMetadata.appData.content.id;

  const payloadJson: string = jsonStringify64({ ...file.fileMetadata.appData.content });
  const payloadBytes = stringToUint8Array(payloadJson);

  // Set max of 3kb for content so enough room is left for metadata
  const shouldEmbedContent = payloadBytes.length < 3000;
  const content = shouldEmbedContent
    ? payloadJson
    : jsonStringify64({ channelId: file.fileMetadata.appData.content.channelId }); // If the full payload can't be embedded into the header file, at least pass the channelId so when getting, the location is known

  if (!shouldEmbedContent) {
    payloads.push({
      key: DEFAULT_PAYLOAD_KEY,
      payload: new OdinBlob([payloadBytes], { type: 'application/json' }) as any,
    });
  }

  const isDraft = file.fileMetadata.appData.fileType === BlogConfig.DraftPostFileType;
  const metadata: UploadFileMetadata = {
    versionTag: file?.fileMetadata.versionTag ?? undefined,
    allowDistribution: !isDraft,
    appData: {
      tags: [file.fileMetadata.appData.content.id],
      uniqueId: uniqueId,
      fileType: isDraft ? BlogConfig.DraftPostFileType : BlogConfig.PostFileType,
      content: content,
      previewThumbnail: previewThumbnail,
      userDate: file.fileMetadata.appData.userDate,
      dataType: postTypeToDataType(file.fileMetadata.appData.content.type),
    },
    senderOdinId: file.fileMetadata.appData.content.authorOdinId,
    isEncrypted: encrypt,
    accessControlList: file.serverMetadata?.accessControlList,
  };

  // Extensions and paths need fixing when not encrypted; It only needs to be good when
  //   it's passed into the axios upload; And when encrypting it happens by default;
  if (!encrypt) {
    payloads = await Promise.all(
      payloads.map(async (payload) => {
        if (!('fixExtension' in payload.payload)) {
          return payload;
        }

        const newBlob = await (payload.payload as any as OdinBlob).fixExtension();
        return {
          ...payload,
          payload: newBlob as any,
        };
      })
    );

    thumbnails = await Promise.all(
      thumbnails.map(async (thumb) => {
        if (!('fixExtension' in thumb.payload)) {
          return thumb;
        }

        const newBlob = await (thumb.payload as any as OdinBlob).fixExtension();
        return {
          ...thumb,
          payload: newBlob as any,
        };
      })
    );
  }

  const result = await uploadFile(
    dotYouClient,
    instructionSet,
    metadata,
    payloads,
    thumbnails,
    encrypt,
    onVersionConflict,
    options
  );
  if (!result) throw new Error('Upload failed');

  return result;
};

const uploadPostHeader = async <T extends PostContent>(
  dotYouClient: DotYouClient,
  file: HomebaseFile<T>,
  channelId: string,
  targetDrive: TargetDrive
) => {
  const instructionSet: UploadInstructionSet = {
    transferIv: getRandom16ByteArray(),
    storageOptions: {
      overwriteFileId: file?.fileId ?? '',
      drive: targetDrive,
    },
    transitOptions: {
      recipients: [],
      schedule: ScheduleOptions.SendLater,
      priority: PriorityOptions.Medium,
      sendContents: SendContents.All, // TODO: Should this be header only?
    },
  };

  const existingPostWithThisSlug = await getPostBySlug(
    dotYouClient,
    channelId,
    file.fileMetadata.appData.content.slug ?? file.fileMetadata.appData.content.id
  );

  if (
    existingPostWithThisSlug &&
    existingPostWithThisSlug?.fileMetadata.appData.content.id !==
      file.fileMetadata.appData.content.id
  ) {
    // There is clash with an existing slug
    file.fileMetadata.appData.content.slug = `${
      file.fileMetadata.appData.content.slug
    }-${new Date().getTime()}`;
  }

  const uniqueId = file.fileMetadata.appData.content.slug
    ? toGuidId(file.fileMetadata.appData.content.slug)
    : file.fileMetadata.appData.content.id;

  const payloadJson: string = jsonStringify64({
    ...file.fileMetadata.appData.content,
    fileId: undefined,
  });
  const payloadBytes = stringToUint8Array(payloadJson);

  // Set max of 3kb for content so enough room is left for metadata
  const shouldEmbedContent = payloadBytes.length < 3000;
  const content = shouldEmbedContent
    ? payloadJson
    : jsonStringify64({ channelId: file.fileMetadata.appData.content.channelId });

  const isDraft = file.fileMetadata.appData.fileType === BlogConfig.DraftPostFileType;
  const metadata: UploadFileMetadata = {
    versionTag: file.fileMetadata.versionTag ?? undefined,
    allowDistribution: !isDraft,
    appData: {
      tags: [file.fileMetadata.appData.content.id],
      uniqueId: uniqueId,
      fileType: isDraft ? BlogConfig.DraftPostFileType : BlogConfig.PostFileType,
      content: content,
      previewThumbnail: file.fileMetadata.appData.previewThumbnail,
      userDate: file.fileMetadata.appData.userDate,
      dataType: postTypeToDataType(file.fileMetadata.appData.content.type),
    },
    senderOdinId: file.fileMetadata.appData.content.authorOdinId,
    isEncrypted: file.fileMetadata.isEncrypted ?? false,
    accessControlList: file.serverMetadata?.accessControlList,
  };

  let runningVersionTag;
  if (!shouldEmbedContent) {
    // Append/update payload
    runningVersionTag = (
      await appendDataToFile(
        dotYouClient,
        file.fileMetadata.isEncrypted ? file.sharedSecretEncryptedKeyHeader : undefined,
        {
          targetFile: {
            fileId: file.fileId as string,
            targetDrive: targetDrive,
          },
          versionTag: file.fileMetadata.versionTag,
        },
        [
          {
            key: DEFAULT_PAYLOAD_KEY,
            payload: new OdinBlob([payloadBytes], { type: 'application/json' }) as any,
          },
        ],
        undefined
      )
    )?.newVersionTag;
  } else if (file.fileMetadata.payloads?.some((p) => p.key === DEFAULT_PAYLOAD_KEY)) {
    // Remove default payload if it was there before
    runningVersionTag = (
      await deletePayload(
        dotYouClient,
        targetDrive,
        file.fileId as string,
        DEFAULT_PAYLOAD_KEY,
        file.fileMetadata.versionTag
      )
    ).newVersionTag;
  }

  if (runningVersionTag) metadata.versionTag = runningVersionTag;
  return await uploadHeader(
    dotYouClient,
    file.fileMetadata.isEncrypted ? file.sharedSecretEncryptedKeyHeader : undefined,
    instructionSet,
    metadata
  );
};

const updatePost = async <T extends PostContent>(
  dotYouClient: DotYouClient,
  file: HomebaseFile<T>,
  channelId: string,
  existingAndNewMediaFiles?: (ImageSource | MediaFile)[]
): Promise<UploadResult> => {
  const targetDrive = GetTargetDriveFromChannelId(channelId);
  const header = await getFileHeader(dotYouClient, targetDrive, file.fileId as string);

  if (!header) throw new Error('Cannot update a post that does not exist');
  if (header?.fileMetadata.versionTag !== file.fileMetadata.versionTag) {
    throw new Error('Version conflict');
  }

  if (
    !file.fileId ||
    !file.serverMetadata?.accessControlList ||
    !file.fileMetadata.appData.content.id
  ) {
    throw new Error('[DotYouCore-js] PostProvider: fileId is required to update a post');
  }

  if (!file.fileMetadata.appData.content.authorOdinId) {
    file.fileMetadata.appData.content.authorOdinId = dotYouClient.getIdentity();
  }

  let runningVersionTag: string = file.fileMetadata.versionTag;
  const existingMediaFiles =
    file.fileMetadata.payloads?.filter((p) => p.key !== DEFAULT_PAYLOAD_KEY) || [];

  const newMediaFiles: ImageSource[] =
    (existingAndNewMediaFiles?.filter(
      (f) => 'file' in f && f.file instanceof Blob
    ) as ImageSource[]) || [];

  // Discover deleted files:
  const deletedMediaFiles: MediaFile[] = [];
  for (let i = 0; existingMediaFiles && i < existingMediaFiles?.length; i++) {
    const existingMediaFile = existingMediaFiles[i];
    if (!existingAndNewMediaFiles?.find((f) => f.key === existingMediaFile.key)) {
      deletedMediaFiles.push(existingMediaFile);
    }
  }

  // Remove the payloads that are removed from the post
  if (deletedMediaFiles.length) {
    for (let i = 0; i < deletedMediaFiles.length; i++) {
      const mediaFile = deletedMediaFiles[i];
      runningVersionTag = (
        await deletePayload(
          dotYouClient,
          targetDrive,
          file.fileId as string,
          mediaFile.key,
          runningVersionTag
        )
      ).newVersionTag;
    }
  }

  // When all media is removed from the post, remove the preview thumbnail
  if (existingMediaFiles.length === deletedMediaFiles.length) {
    file.fileMetadata.appData.previewThumbnail = undefined;
  }

  // Process new files:
  const payloads: PayloadFile[] = [];
  const thumbnails: ThumbnailFile[] = [];
  let previewThumbnail: EmbeddedThumb | undefined;
  for (let i = 0; newMediaFiles && i < newMediaFiles.length; i++) {
    const newMediaFile = newMediaFiles[i];
    // We ignore existing files as they are just kept
    if (!('file' in newMediaFile)) {
      continue;
    }

    const payloadKey =
      newMediaFile.key ||
      `${POST_MEDIA_PAYLOAD_KEY}${(existingAndNewMediaFiles || newMediaFiles).length + i}`;

    // Custom blob to avoid reading and writing the file to disk again
    const payloadBlob = new OdinBlob((newMediaFile.filepath || newMediaFile.uri) as string, {
      type: newMediaFile.type || 'image/jpeg',
    }) as any as Blob;

    const { additionalThumbnails, tinyThumb } = await createThumbnails(newMediaFile, payloadKey);

    payloads.push({
      payload: payloadBlob,
      key: payloadKey,
      previewThumbnail: tinyThumb,
    });
    thumbnails.push(...additionalThumbnails);
    previewThumbnail = previewThumbnail || tinyThumb;
  }

  // Append new files:
  if (payloads.length) {
    const appendInstructionSet: AppendInstructionSet = {
      targetFile: {
        fileId: file.fileId as string,
        targetDrive: targetDrive,
      },
      versionTag: runningVersionTag,
    };

    runningVersionTag =
      (
        await appendDataToFile(
          dotYouClient,
          header?.fileMetadata.isEncrypted ? header.sharedSecretEncryptedKeyHeader : undefined,
          appendInstructionSet,
          payloads,
          thumbnails
        )
      )?.newVersionTag || runningVersionTag;
  }

  if (file.fileMetadata.appData.content.type !== 'Article') {
    if (existingMediaFiles?.length) {
      file.fileMetadata.appData.content.primaryMediaFile = {
        fileId: file.fileId,
        fileKey: existingMediaFiles[0].key,
        type: existingMediaFiles[0].contentType,
      };
    }
  }

  file.fileMetadata.appData.previewThumbnail =
    deletedMediaFiles.length && existingMediaFiles.length === 1
      ? previewThumbnail
      : file.fileMetadata.appData.previewThumbnail || previewThumbnail;

  const encrypt = !(
    file.serverMetadata.accessControlList?.requiredSecurityGroup === SecurityGroupType.Anonymous ||
    file.serverMetadata.accessControlList?.requiredSecurityGroup === SecurityGroupType.Authenticated
  );
  file.fileMetadata.isEncrypted = encrypt;
  file.fileMetadata.versionTag = runningVersionTag;
  const result = await uploadPostHeader(dotYouClient, file, channelId, targetDrive);
  if (!result) throw new Error('[DotYouCore-js] PostProvider: Post update failed');

  return result;
};
