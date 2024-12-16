/* eslint-disable @typescript-eslint/no-unused-vars */
import { savePost } from '../src/provider/feed/RNPostUploadProvider';
import {
  ApiType,
  DotYouClient,
  getFileHeader,
  HomebaseFile,
  MediaFile,
  NewHomebaseFile,
  SecurityGroupType,
  TransferUploadStatus,
  uploadFile,
  uploadHeader,
  UploadResult,
} from '@homebase-id/js-lib/core';
import { ImageSource } from '../src/provider/image/RNImageProvider';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { getRandom16ByteArray } from '@homebase-id/js-lib/helpers';
import { BlogConfig, getPost, PostContent } from '@homebase-id/js-lib/public';

jest.mock('@homebase-id/js-lib/core');
jest.mock('@homebase-id/js-lib/public');

jest.mock('react-native-inappbrowser-reborn', () => ({
  isAvailable: jest.fn(),
  open: jest.fn(),
}));

jest.mock('@bam.tech/react-native-image-resizer', () => {
  return {
    createResizedImage: jest.fn().mockReturnValue(
      Promise.resolve({
        path: 'path',
        uri: 'uri:///',
        size: 100,
        name: 'Resized Photo',
        width: 480,
        height: 640,
      })
    ),
  };
});

jest.mock('react-native-compressor', () => ({
  Video: {
    compress: (uri: string) => Promise.resolve(uri),
  },
}));

jest.mock('ffmpeg-kit-react-native', () => ({
  // FFprobeKit: jest.fn().mockResolvedValue(),
  // FFmpegKit: jest.fn().mockResolvedValue(SessionState.COMPLETED),
}));

describe('RNPostUploadProvider', () => {
  let file: HomebaseFile<PostContent> | NewHomebaseFile<PostContent>;
  let channelId: string;
  let toSaveFiles: (ImageSource | MediaFile)[];
  let linkPreviews: LinkPreview[];
  let onVersionConflict: jest.Mock;
  let onUpdate: jest.Mock;
  const dotYouClient = new DotYouClient({
    loggedInIdentity: 'frodobaggins.me',
    api: ApiType.App,
    headers: {},
    sharedSecret: new Uint8Array(32),
  });

  beforeEach(() => {
    const mockGetRandom16Bytes = jest.fn().mockReturnValue(new Uint8Array(16));
    (getRandom16ByteArray as jest.Mock) = mockGetRandom16Bytes;
    dotYouClient.getLoggedInIdentity = jest.fn().mockReturnValue('frodobaggins.me');
    dotYouClient.getSharedSecret = jest.fn().mockReturnValue(new Uint8Array(32));
    (getFileHeader as jest.Mock).mockClear();
    file = {
      fileId: 'new-file-id',
      fileMetadata: {
        versionTag: 'old-version-tag',
        appData: {
          content: {
            authorOdinId: dotYouClient.getLoggedInIdentity(),
            type: 'Tweet',
            caption: 'Here is a demo caption',
            id: 'random-guid-id',
            slug: 'random-guid-id',
            channelId: BlogConfig.PublicChannelId,
            reactAccess: true,
          },
        },
      },
      serverMetadata: {
        allowDistribution: true,
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Anonymous,
          odinIdList: ['samwisegamgee.me', 'pippin.me'],
        },
      },
    } as HomebaseFile<PostContent>;
    channelId = 'test-channel-id';
    toSaveFiles = [];
    linkPreviews = [];
    onVersionConflict = jest.fn();
    onUpdate = jest.fn();
  });

  it('should save a new post', async () => {
    const result: UploadResult = {
      newVersionTag: 'new-version-tag',
      recipientStatus: {
        'samwisegamgee.me': TransferUploadStatus.DeliveredToTargetDrive,
        'pippin.me': TransferUploadStatus.DeliveredToTargetDrive,
      },
      file: {
        fileId: 'new-file-id',
        targetDrive: BlogConfig.FeedDrive,
      },
      globalTransitIdFileIdentifier: {
        globalTransitId: 'global-transit-id',
        targetDrive: BlogConfig.FeedDrive,
      },
      keyHeader: undefined,
    };

    delete file.fileId;

    (getPost as jest.Mock).mockResolvedValue(undefined);
    (uploadFile as jest.Mock).mockResolvedValue(result);

    const uploadResult = await savePost(
      dotYouClient,
      file,
      undefined,
      channelId,
      toSaveFiles,
      linkPreviews,
      onVersionConflict,
      onUpdate
    );

    expect(uploadResult).toEqual(result);
    expect(file.fileMetadata.appData.content.id).toBeTruthy();
    expect(file.fileMetadata.appData.content.authorOdinId).toBe('frodobaggins.me');
  });

  it('should update an existing post', async () => {
    file.fileId = 'existing-file-id';
    file.fileMetadata.appData.content.caption = 'updated-post';
    const result: UploadResult = {
      newVersionTag: 'new-version-tag',
      recipientStatus: {
        'samwisegamgee.me': TransferUploadStatus.DeliveredToTargetDrive,
        'pippin.me': TransferUploadStatus.DeliveredToTargetDrive,
      },
      file: {
        fileId: 'new-file-id',
        targetDrive: BlogConfig.FeedDrive,
      },
      globalTransitIdFileIdentifier: {
        globalTransitId: 'global-transit-id',
        targetDrive: BlogConfig.FeedDrive,
      },
      keyHeader: undefined,
    };

    const fileHeader: HomebaseFile<string> = {
      fileId: 'existing-file-id',
      sharedSecretEncryptedKeyHeader: {
        encryptedAesKey: new Uint8Array(32),
        iv: new Uint8Array(16),
        encryptionVersion: 0,
        type: 0,
      },
      fileState: 'active',
      fileSystemType: 'Standard',
      serverMetadata: {
        doNotIndex: false,
        allowDistribution: true,
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Anonymous,
          odinIdList: ['samwisegamgee.me', 'pippin.me'],
        },
      },
      fileMetadata: {
        originalAuthor: 'frodobaggins.me',
        versionTag: 'old-version-tag',
        created: new Date().getTime(),
        isEncrypted: false,
        senderOdinId: 'frodobaggins.me',
        updated: new Date().getTime(),
        payloads: [],
        appData: {
          fileType: 0,
          dataType: 0,
          content: 'old-post',
        },
      },
    };

    (getFileHeader as jest.Mock).mockResolvedValue(fileHeader);

    (uploadHeader as jest.Mock).mockResolvedValue(result);

    const uploadResult = await savePost(
      dotYouClient,
      file,
      undefined,
      channelId,
      toSaveFiles,
      linkPreviews,
      onVersionConflict,
      onUpdate
    );

    expect(uploadResult).toEqual(result);
    expect(file.fileMetadata.appData.content.authorOdinId).toBe('frodobaggins.me');
  });

  it('should handle version conflict', async () => {
    file.fileId = 'existing-file-id';
    file.fileMetadata.appData.content.id = 'existing-content-id';

    const fileHeader: HomebaseFile<string> = {
      fileId: 'existing-file-id',
      sharedSecretEncryptedKeyHeader: {
        encryptedAesKey: new Uint8Array(32),
        iv: new Uint8Array(16),
        encryptionVersion: 0,
        type: 0,
      },
      fileState: 'active',
      fileSystemType: 'Standard',
      serverMetadata: {
        doNotIndex: false,
        allowDistribution: true,
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Anonymous,
          odinIdList: ['samwisegamgee.me', 'pippin.me'],
        },
      },
      fileMetadata: {
        originalAuthor: 'frodobaggins.me',
        versionTag: 'server-version-tag',
        created: new Date().getTime(),
        isEncrypted: false,
        senderOdinId: 'frodobaggins.me',
        updated: new Date().getTime(),
        payloads: [],
        appData: {
          fileType: 0,
          dataType: 0,
          content: 'old-post',
        },
      },
    };

    (getFileHeader as jest.Mock).mockResolvedValue(fileHeader);

    (uploadFile as jest.Mock).mockRejectedValue(new Error('Version conflict'));

    await expect(
      savePost(
        dotYouClient,
        file,
        undefined,
        channelId,
        toSaveFiles,
        linkPreviews,
        onVersionConflict,
        onUpdate
      )
    ).rejects.toThrow('Version conflict');
  });

  it('should handle missing ACL', async () => {
    delete file.serverMetadata;
    delete file.fileId;
    await expect(
      savePost(
        dotYouClient,
        file,
        undefined,
        channelId,
        toSaveFiles,
        linkPreviews,
        onVersionConflict,
        onUpdate
      )
    ).rejects.toThrow('ACL is required to save a post');
  });

  it('should handle link previews without media', async () => {
    linkPreviews = [
      {
        url: 'https://example.com',
        title: 'Example',
        description: 'Example description',
        imageUrl: 'https://example.com/image.jpg',
        imageHeight: 100,
        imageWidth: 100,
      },
    ];

    const result: UploadResult = {
      newVersionTag: 'new-version-tag',
      recipientStatus: {
        'samwisegamgee.me': TransferUploadStatus.DeliveredToTargetDrive,
        'pippin.me': TransferUploadStatus.DeliveredToTargetDrive,
      },
      file: {
        fileId: 'new-file-id',
        targetDrive: BlogConfig.FeedDrive,
      },
      globalTransitIdFileIdentifier: {
        globalTransitId: 'global-transit-id',
        targetDrive: BlogConfig.FeedDrive,
      },
      keyHeader: undefined,
    };

    const fileHeader: HomebaseFile<string> = {
      fileId: 'existing-file-id',
      sharedSecretEncryptedKeyHeader: {
        encryptedAesKey: new Uint8Array(32),
        iv: new Uint8Array(16),
        encryptionVersion: 0,
        type: 0,
      },
      fileState: 'active',
      fileSystemType: 'Standard',
      serverMetadata: {
        doNotIndex: false,
        allowDistribution: true,
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Anonymous,
          odinIdList: ['samwisegamgee.me', 'pippin.me'],
        },
      },
      fileMetadata: {
        originalAuthor: 'frodobaggins.me',
        versionTag: 'old-version-tag',
        created: new Date().getTime(),
        isEncrypted: false,
        senderOdinId: 'frodobaggins.me',
        updated: new Date().getTime(),
        payloads: [],
        appData: {
          fileType: 0,
          dataType: 0,
          content: 'old-post',
        },
      },
    };

    (getFileHeader as jest.Mock).mockResolvedValue(fileHeader);

    (uploadFile as jest.Mock).mockResolvedValue(result);

    const uploadResult = await savePost(
      dotYouClient,
      file,
      undefined,
      channelId,
      toSaveFiles,
      linkPreviews,
      onVersionConflict,
      onUpdate
    );

    expect(uploadResult).toEqual(result);
    expect(file.fileMetadata.appData.content.id).toBeTruthy();
    expect(file.fileMetadata.appData.content.authorOdinId).toBe('frodobaggins.me');
  });
});
