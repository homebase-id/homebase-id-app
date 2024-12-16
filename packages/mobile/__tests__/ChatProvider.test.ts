/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ApiType,
  deleteFile,
  deleteFilesByGroupId,
  DotYouClient,
  getFileHeaderByUniqueId,
  HomebaseFile,
  NewHomebaseFile,
  queryBatch,
  SecurityGroupType,
  TransferUploadStatus,
  uploadFile,
  uploadHeader,
} from '@homebase-id/js-lib/core';
import {
  getChatMessages,
  deleteAllChatMessages,
  getChatMessage,
  uploadChatMessage,
  updateChatMessage,
  hardDeleteChatMessage,
  softDeleteChatMessage,
  requestMarkAsRead,
  ChatDeliveryStatus,
  ChatMessage,
} from '../src/provider/chat/ChatProvider';
import * as ChatProvider from '../src/provider/chat/ChatProvider';
import { ChatDrive, UnifiedConversation } from '../src/provider/chat/ConversationProvider';
import { sendReadReceipt } from '@homebase-id/js-lib/peer';
import { getRandom16ByteArray } from '@homebase-id/js-lib/helpers';

jest.mock('@homebase-id/js-lib/core');
jest.mock('@homebase-id/js-lib/peer');

jest.mock('react-native-inappbrowser-reborn', () => ({
  isAvailable: jest.fn(),
  open: jest.fn(),
}));

jest.mock('react-native-compressor', () => ({
  Video: {
    compress: (uri: string) => Promise.resolve(uri),
  },
}));

jest.mock('ffmpeg-kit-react-native', () => ({
  // FFprobeKit: jest.fn().mockResolvedValue(),
  // FFmpegKit: jest.fn().mockResolvedValue(SessionState.COMPLETED),
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

describe('ChatProvider', () => {
  let dotYouClient: DotYouClient;
  const mockGetRandom16Bytes = jest.fn().mockReturnValue(new Uint8Array(16));
  (getRandom16ByteArray as jest.Mock) = mockGetRandom16Bytes;
  beforeEach(() => {
    dotYouClient = new DotYouClient({
      loggedInIdentity: 'frodobaggins.me',
      api: ApiType.App,
      headers: {},
      sharedSecret: new Uint8Array(32),
    });
  });

  it('should get chat messages', async () => {
    const conversationId = 'conversation-id';
    const cursorState = undefined;
    const pageSize = 10;

    const mockResponse = {
      searchResults: [],
    };

    (queryBatch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getChatMessages(dotYouClient, conversationId, cursorState, pageSize);

    expect(queryBatch).toHaveBeenCalledWith(
      dotYouClient,
      { targetDrive: ChatDrive, groupId: [conversationId] },
      {
        maxRecords: pageSize,
        cursorState,
        includeMetadataHeader: true,
        includeTransferHistory: true,
      }
    );
    expect(result).toEqual(mockResponse);
  });

  it('should delete all chat messages', async () => {
    const conversationId = 'conversation-id';

    (deleteFilesByGroupId as jest.Mock).mockResolvedValue(true);

    const result = await deleteAllChatMessages(dotYouClient, conversationId);

    expect(deleteFilesByGroupId).toHaveBeenCalledWith(dotYouClient, ChatDrive, [conversationId]);
    expect(result).toBe(true);
  });

  it('should get a chat message', async () => {
    const chatMessageId = 'chat-message-id';
    const mockFileHeader = { fileId: chatMessageId };

    (getFileHeaderByUniqueId as jest.Mock).mockResolvedValue(mockFileHeader);

    const result = await getChatMessage(dotYouClient, chatMessageId);

    expect(getFileHeaderByUniqueId).toHaveBeenCalledWith(dotYouClient, ChatDrive, chatMessageId);
    expect(result).toEqual(mockFileHeader);
  });

  it('should upload a chat message', async () => {
    const message: NewHomebaseFile<ChatMessage> = {
      fileId: 'file-id',
      fileMetadata: {
        appData: {
          content: {
            message: 'Hello',
            deliveryStatus: ChatDeliveryStatus.Sent,
          },
        },
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Owner,
        },
      },
    };
    const recipients = ['recipient1', 'recipient2'];
    const files = undefined;
    const linkPreviews = undefined;

    (uploadFile as jest.Mock).mockResolvedValue({ file: { fileId: 'file-id' } });

    const result = await uploadChatMessage(dotYouClient, message, recipients, files, linkPreviews);

    expect(uploadFile).toHaveBeenCalled();
    expect(result).toHaveProperty('file.fileId', 'file-id');
  });

  it('should update a chat message', async () => {
    const message: HomebaseFile<ChatMessage> = {
      fileId: '14962219-a0e1-6a00-028e-e64531e86b28',
      fileState: 'active',
      fileSystemType: 'Standard',
      sharedSecretEncryptedKeyHeader: {
        encryptedAesKey: new Uint8Array(32),
        encryptionVersion: 1,
        iv: new Uint8Array(16),
        type: 2,
      },
      fileMetadata: {
        globalTransitId: '70980857-d4c6-4719-8261-56d5cd097f8b',
        originalAuthor: 'samwisegamgee.me',
        created: 1727271095788,
        updated: 1727334733545,
        transitCreated: 1727334732786,
        transitUpdated: 0,
        isEncrypted: true,
        senderOdinId: 'samwisegamgee.me',
        appData: {
          uniqueId: 'f93d0d93-e9e1-b265-dd68-1fb4f1410e54',
          tags: [],
          fileType: 7878,
          dataType: 0,
          groupId: '792516dd-891f-da1b-b3e6-b0cc7b8c835b',
          content: {
            message: '',
            deliveryStatus: 30,
            deliveryDetails: {
              'samwisegamgee.me': 30,
              'frodobaggins.me': 30,
            },
          },
          archivalStatus: 2,
        },
        versionTag: 'c5d22219-906e-bb00-5d74-1c38603062a9',
        payloads: [],
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Owner,
          circleIdList: null,
          odinIdList: null,
        },
        doNotIndex: false,
        allowDistribution: false,
      },
    };

    const recipients = ['frodo', 'sam'];

    (uploadHeader as jest.Mock).mockResolvedValue({ newVersionTag: 'new-version-tag' });

    const result = await updateChatMessage(dotYouClient, message, recipients);

    expect(uploadHeader).toHaveBeenCalled();
    expect(result).toHaveProperty('newVersionTag', 'new-version-tag');
  });

  it('should hard delete a chat message', async () => {
    const message: HomebaseFile<ChatMessage> = {
      fileId: '14962219-a0e1-6a00-028e-e64531e86b28',
      fileState: 'active',
      fileSystemType: 'Standard',
      sharedSecretEncryptedKeyHeader: {
        encryptedAesKey: new Uint8Array(32),
        encryptionVersion: 1,
        iv: new Uint8Array(16),
        type: 2,
      },
      fileMetadata: {
        globalTransitId: '70980857-d4c6-4719-8261-56d5cd097f8b',
        originalAuthor: 'samwisegamgee.me',
        created: 1727271095788,
        updated: 1727334733545,
        transitCreated: 1727334732786,
        transitUpdated: 0,
        isEncrypted: true,
        senderOdinId: 'samwisegamgee.me',
        appData: {
          uniqueId: 'f93d0d93-e9e1-b265-dd68-1fb4f1410e54',
          tags: [],
          fileType: 7878,
          dataType: 0,
          groupId: '792516dd-891f-da1b-b3e6-b0cc7b8c835b',
          content: {
            message: '',
            deliveryStatus: 30,
            deliveryDetails: {
              'samwisegamgee.me': 30,
              'frodobaggins.me': 30,
            },
          },
          archivalStatus: 2,
        },
        versionTag: 'c5d22219-906e-bb00-5d74-1c38603062a9',
        payloads: [],
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Owner,
          circleIdList: null,
          odinIdList: null,
        },
        doNotIndex: false,
        allowDistribution: false,
      },
    };

    (deleteFile as jest.Mock).mockResolvedValue(true);

    const result = await hardDeleteChatMessage(dotYouClient, message);

    expect(deleteFile).toHaveBeenCalledWith(dotYouClient, ChatDrive, message.fileId, []);
    expect(result).toBe(true);
  });

  it('should soft delete a chat message', async () => {
    const message: HomebaseFile<ChatMessage> = {
      fileId: '14962219-a0e1-6a00-028e-e64531e86b28',
      fileState: 'active',
      fileSystemType: 'Standard',
      sharedSecretEncryptedKeyHeader: {
        encryptedAesKey: new Uint8Array(32),
        encryptionVersion: 1,
        iv: new Uint8Array(16),
        type: 2,
      },
      fileMetadata: {
        globalTransitId: '70980857-d4c6-4719-8261-56d5cd097f8b',
        originalAuthor: 'samwisegamgee.me',
        created: 1727271095788,
        updated: 1727334733545,
        transitCreated: 1727334732786,
        transitUpdated: 0,
        isEncrypted: true,
        senderOdinId: 'samwisegamgee.me',
        appData: {
          uniqueId: 'f93d0d93-e9e1-b265-dd68-1fb4f1410e54',
          tags: [],
          fileType: 7878,
          dataType: 0,
          groupId: '792516dd-891f-da1b-b3e6-b0cc7b8c835b',
          content: {
            message: '',
            deliveryStatus: 30,
            deliveryDetails: {
              'samwisegamgee.me': 30,
              'frodobaggins.me': 30,
            },
          },
          archivalStatus: 2,
        },
        versionTag: 'c5d22219-906e-bb00-5d74-1c38603062a9',
        payloads: [],
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Owner,
          circleIdList: null,
          odinIdList: null,
        },
        doNotIndex: false,
        allowDistribution: false,
      },
    };
    const recipients = ['recipient1', 'recipient2'];

    const updateChatMessageSpy = jest.spyOn(ChatProvider, 'updateChatMessage').mockResolvedValue({
      file: { fileId: '14962219-a0e1-6a00-028e-e64531e86b28', targetDrive: ChatDrive },
      globalTransitIdFileIdentifier: {
        globalTransitId: '70980857-d4c6-4719-8261-56d5cd097f8b',
        targetDrive: ChatDrive,
      },
      keyHeader: {
        aesKey: new Uint8Array(32),
        iv: new Uint8Array(16),
      },
      newVersionTag: 'new-version-tag',
      recipientStatus: {
        recipient1: TransferUploadStatus.DeliveredToTargetDrive,
        recipient2: TransferUploadStatus.DeliveredToTargetDrive,
      },
    });
    const result = await softDeleteChatMessage(dotYouClient, message, recipients);

    expect(updateChatMessage).toHaveBeenCalled();
    expect(result).toHaveProperty('newVersionTag', 'new-version-tag');
    updateChatMessageSpy.mockRestore();
  });

  it('should request mark as read', async () => {
    const conversation = { fileId: 'conversation-id' } as HomebaseFile<UnifiedConversation>;
    const messages = [
      {
        fileId: 'message-id',
        fileMetadata: {
          appData: { content: { deliveryStatus: ChatDeliveryStatus.Sent } },
          senderOdinId: 'sender-Odin-Id',
        },
      },
    ] as HomebaseFile<ChatMessage>[];

    (sendReadReceipt as jest.Mock).mockResolvedValue(true);

    const result = await requestMarkAsRead(dotYouClient, conversation, messages);

    expect(sendReadReceipt).toHaveBeenCalledWith(dotYouClient, ChatDrive, ['message-id']);
    expect(result).toBe(true);
  });
});
