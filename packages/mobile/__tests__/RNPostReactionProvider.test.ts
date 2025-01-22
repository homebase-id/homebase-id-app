/* eslint-disable @typescript-eslint/no-unused-vars */
import { saveComment, RawReactionContent } from '../src/provider/feed/RNPostReactionProvider';
import {
  DotYouClient,
  NewHomebaseFile,
  HomebaseFile,
  ApiType,
  uploadFile,
  SecurityGroupType,
  UploadResult,
  TransferUploadStatus,
} from '@homebase-id/js-lib/core';

import { createThumbnails } from '../src/provider/image/RNThumbnailProvider';
import { GetTargetDriveFromChannelId, ReactionContext } from '@homebase-id/js-lib/public';
import { TransitUploadResult, uploadFileOverPeer } from '@homebase-id/js-lib/peer';
import { getRandom16ByteArray } from '@homebase-id/js-lib/helpers';

jest.mock('@homebase-id/js-lib/core');
jest.mock('../src/provider/image/RNThumbnailProvider');
jest.mock('@homebase-id/js-lib/public');
jest.mock('@homebase-id/js-lib/peer');

jest.mock('react-native-inappbrowser-reborn', () => ({
  isAvailable: jest.fn(),
  open: jest.fn(),
}));

jest.mock('react-native', () => ({
  Linking: {
    openURL: jest.fn(),
  },
  NativeModules: {
    OdinBlobModule: {
      encryptFileWithAesCbc16: jest.fn(),
      decryptFileWithAesCbc16: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
    select: jest.fn().mockImplementation((obj) => obj.ios),
  },
}));

jest.mock('react-native', () => ({
  Linking: {
    openURL: jest.fn(),
  },
  NativeModules: {
    OdinBlobModule: {
      encryptFileWithAesCbc16: jest.fn(),
      decryptFileWithAesCbc16: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
  },
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

jest.mock('react-native-fs', () => {
  return {
    stat: jest.fn().mockResolvedValue({ size: 100 }),
    readFile: jest.fn().mockReturnValue(Promise.resolve('')),
    copyFile: jest.fn(),
    unlink: jest.fn(),
    MainBundlePath: jest.fn(),
    CachesDirectoryPath: jest.fn(),
    DocumentDirectoryPath: jest.fn(),
    ExternalDirectoryPath: jest.fn(),
    ExternalStorageDirectoryPath: jest.fn(),
    TemporaryDirectoryPath: jest.fn(),
    LibraryDirectoryPath: jest.fn(),
    PicturesDirectoryPath: jest.fn(),
  };
});

describe('RNPostReactionProvider', () => {
  let context: ReactionContext;
  let comment: NewHomebaseFile<RawReactionContent> | HomebaseFile<RawReactionContent>;
  const dotYouClient = new DotYouClient({
    hostIdentity: 'frodobaggins.me',
    api: ApiType.App,
    headers: {},
    sharedSecret: new Uint8Array(32),
  });
  beforeEach(() => {
    const mockGetRandom16Bytes = jest.fn().mockReturnValue(new Uint8Array(16));
    (getRandom16ByteArray as jest.Mock) = mockGetRandom16Bytes;
    dotYouClient.getLoggedInIdentity = jest.fn().mockReturnValue('frodobaggins.me');
    dotYouClient.getSharedSecret = jest.fn().mockReturnValue(new Uint8Array(32));

    context = {
      target: { isEncrypted: false, globalTransitId: 'globalTransitId' },
      odinId: 'authorOdinId',
      channelId: 'channelId',
    } as ReactionContext;

    comment = {
      fileId: 'fileId',
      fileSystemType: 'Comment',
      fileMetadata: {
        appData: {
          content: {
            body: 'Sample Comment',
            authorOdinId: 'authorOdinId',
            attachment: {
              height: 1920,
              width: 1080,
              mimeType: 'image/jpeg',
              uri: 'uri',
              fileSize: 100,
              type: 'image/jpeg',
            },
          },
          versionTag: 'v1',
          groupId: 'groupId',
          uniqueId: 'uniqueId',
        },
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Anonymous,
        },
      },
    } as NewHomebaseFile<RawReactionContent>;

    (GetTargetDriveFromChannelId as jest.Mock).mockReturnValue('targetDrive');
    (createThumbnails as jest.Mock).mockResolvedValue({
      additionalThumbnails: [],
      tinyThumb: { uri: 'tinyThumbUri' },
    });

    const uploadFileMock = jest.fn().mockResolvedValue({
      file: {
        fileId: 'fileId',
        targetDrive: {
          alias: 'alias',
          type: 'type',
        },
      },
      globalTransitIdFileIdentifier: {
        globalTransitId: 'globalTransitId',
        targetDrive: {
          alias: 'alias',
          type: 'type',
        },
      },
      keyHeader: {
        aesKey: new Uint8Array(32),
        iv: new Uint8Array(16),
      },
      newVersionTag: 'newVersionTag',
      recipientStatus: {
        authorOdinId: TransferUploadStatus.DeliveredToInbox,
      },
    } as UploadResult);

    const peerUploadFileMock = jest.fn().mockResolvedValue({
      file: {
        fileId: 'fileId',
        targetDrive: {
          alias: 'alias',
          type: 'type',
        },
      },
      remoteGlobalTransitIdFileIdentifier: {
        globalTransitId: 'globalTransitId',
        targetDrive: {
          alias: 'alias',
          type: 'type',
        },
      },
      keyHeader: {
        aesKey: new Uint8Array(32),
        iv: new Uint8Array(16),
      },
      newVersionTag: 'newVersionTag',
      recipientStatus: {
        authorOdinId: TransferUploadStatus.DeliveredToInbox,
      },
    } as TransitUploadResult);

    (uploadFile as jest.Mock).mockImplementation(uploadFileMock);
    (uploadFileOverPeer as jest.Mock).mockImplementation(peerUploadFileMock);
  });

  it('should save a comment with an attachment', async () => {
    const result = await saveComment(dotYouClient, context, comment);
    expect(result).toBeDefined();
  });

  it('should save a comment without an attachment', async () => {
    delete comment.fileMetadata.appData.content.attachment;
    const result = await saveComment(dotYouClient, context, comment);
    expect(result).toBeDefined();
  });

  it('should throw an error if upload fails', async () => {
    context.odinId = 'frodobaggins.me';
    (uploadFile as jest.Mock).mockResolvedValue(null);
    await expect(saveComment(dotYouClient, context, comment)).rejects.toThrow('Upload failed');
  });

  it('should handle local comments correctly', async () => {
    context.odinId = dotYouClient.getLoggedInIdentity();
    const result = await saveComment(dotYouClient, context, comment);
    expect(result).toBeDefined();
  });

  it('should handle remote comments correctly', async () => {
    context.odinId = 'authorOdinId';
    const result = await saveComment(dotYouClient, context, comment);
    expect(result).toBeDefined();
  });
});
