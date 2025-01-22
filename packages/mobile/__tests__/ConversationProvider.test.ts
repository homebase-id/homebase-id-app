/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  ApiType,
  DotYouClient,
  getContentFromHeaderOrPayload,
  getFileHeaderByUniqueId,
  HomebaseFile,
  NewHomebaseFile,
  queryBatch,
  QueryBatchResponse,
  SecurityGroupType,
  uploadFile,
  uploadHeader,
} from '@homebase-id/js-lib/core';
import {
  CHAT_CONVERSATION_FILE_TYPE,
  ConversationMetadata,
  ConversationWithYourself,
  ConversationWithYourselfId,
  getConversation,
  getConversationMetadata,
  getConversations,
  UnifiedConversation,
  updateConversation,
  uploadConversation,
  uploadConversationMetadata,
} from '../src/provider/chat/ConversationProvider';
import { ImageSource } from '../src/provider/image/RNImageProvider';
import { getRandom16ByteArray } from '@homebase-id/js-lib/helpers';

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

describe('ConversationProvider', () => {
  const dotYouClientMock = new DotYouClient({
    hostIdentity: 'frodobaggins.me',
    api: ApiType.App,
    headers: {},
    sharedSecret: new Uint8Array(16),
  });
  const mockGetRandom16Bytes = jest.fn().mockReturnValue(new Uint8Array(16));
  (getRandom16ByteArray as jest.Mock) = mockGetRandom16Bytes;

  describe('getConversations', () => {
    it('should return conversations when queryBatch returns a valid response', async () => {
      const queryBatchMock = jest.fn().mockResolvedValue({
        searchResults: [
          {
            /* mock result */
          },
        ],
      });
      (queryBatch as jest.Mock) = queryBatchMock;

      const result = await getConversations(dotYouClientMock, undefined, 10);

      expect(queryBatchMock).toHaveBeenCalled();
      expect(result).toHaveProperty('searchResults');
    });

    it('should return null when queryBatch returns no response', async () => {
      const queryBatchMock = jest.fn().mockResolvedValue(null);
      (queryBatch as jest.Mock) = queryBatchMock;

      const result = await getConversations(dotYouClientMock, undefined, 10);

      expect(queryBatchMock).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getConversation', () => {
    it('should return ConversationWithYourself when conversationId is ConversationWithYourselfId', async () => {
      const result = await getConversation(dotYouClientMock, ConversationWithYourselfId);

      expect(result).toEqual(ConversationWithYourself);
    });

    it('should return a valid conversation when conversationId is valid', async () => {
      const getFileHeaderByUniqueIdMock = jest.fn().mockResolvedValue({
        fileMetadata: { appData: { content: { recipients: [] } } },
      });
      (getFileHeaderByUniqueId as jest.Mock) = getFileHeaderByUniqueIdMock;

      const result = await getConversation(dotYouClientMock, 'valid-id');

      expect(getFileHeaderByUniqueIdMock).toHaveBeenCalled();
      expect(result).toHaveProperty('fileMetadata');
    });

    it('should return null when conversationId is invalid', async () => {
      const getFileHeaderByUniqueIdMock = jest.fn().mockResolvedValue(null);
      (getFileHeaderByUniqueId as jest.Mock) = getFileHeaderByUniqueIdMock;

      const result = await getConversation(dotYouClientMock, 'invalid-id');

      expect(getFileHeaderByUniqueIdMock).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('uploadConversation', () => {
    const conversation: NewHomebaseFile<UnifiedConversation> = {
      fileMetadata: {
        appData: {
          uniqueId: 'unique-id',
          content: {
            recipients: ['frodo', 'sam'],
            title: 'Random ded Group',
          },
        },
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Owner,
        },
      },
    };

    it('should upload conversation without image', async () => {
      const uploadFileMock = jest.fn().mockResolvedValue({});
      (uploadFile as jest.Mock) = uploadFileMock;

      await uploadConversation(dotYouClientMock, conversation);

      expect(uploadFileMock).toHaveBeenCalled();
    });

    it('should upload conversation with image', async () => {
      const uploadFileMock = jest.fn().mockResolvedValue({});

      (uploadFile as jest.Mock) = uploadFileMock;

      const image = {
        filepath: 'path/to/image',
        uri: 'uri/to/image',
        height: 300,
        width: 300,
      } as ImageSource;

      await uploadConversation(dotYouClientMock, conversation, false, image);
      expect(uploadFileMock).toHaveBeenCalled();
      const args = uploadFileMock.mock.calls[0];
      const payloads = args[3];
      const thumbnails = args[4];
      expect(payloads).toHaveLength(1);
      expect(thumbnails.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateConversation', () => {
    const conversation: HomebaseFile<UnifiedConversation> = {
      fileId: 'file-id',
      fileState: 'active',
      fileSystemType: 'Standard',
      sharedSecretEncryptedKeyHeader: {
        encryptedAesKey: new Uint8Array(32),
        encryptionVersion: 1,
        iv: new Uint8Array(16),
        type: 2,
      },
      fileMetadata: {
        originalAuthor: '',
        appData: {
          uniqueId: 'unique-id',
          content: {
            recipients: ['frodo', 'sam'],
            title: 'Random ded Updated Group',
          },
          fileType: CHAT_CONVERSATION_FILE_TYPE,
          dataType: 0,
        },
        created: 1727354465999,
        updated: 1727354465999,
        isEncrypted: true,
        senderOdinId: 'frodo',
        payloads: [],
        versionTag: 'old-version',
      },
      serverMetadata: {
        accessControlList: {
          requiredSecurityGroup: SecurityGroupType.Owner,
        },
        allowDistribution: true,
        doNotIndex: false,
      },
    };

    it('should update conversation without conflict', async () => {
      const uploadHeaderMock = jest.fn().mockResolvedValue({});
      (uploadHeader as jest.Mock) = uploadHeaderMock;

      await updateConversation(dotYouClientMock, conversation);

      expect(uploadHeaderMock).toHaveBeenCalled();
    });

    it('should handle version conflict', async () => {
      const uploadHeaderMock = jest.fn().mockImplementation((_, __, ___, ____, conflictHandler) => {
        conflictHandler();
      });
      (uploadHeader as jest.Mock) = uploadHeaderMock;

      const getConversationMock = jest.fn().mockResolvedValue({
        fileMetadata: { versionTag: 'new-version' },
        sharedSecretEncryptedKeyHeader: {},
      });
      (getConversation as jest.Mock) = getConversationMock;

      await updateConversation(dotYouClientMock, conversation);

      expect(uploadHeaderMock).toHaveBeenCalled();
      expect(getConversationMock).toHaveBeenCalled();
    });
  });

  describe('getConversationMetadata', () => {
    it('should return metadata when queryBatch returns a valid response', async () => {
      const queryBatchMock = jest.fn().mockResolvedValue({
        searchResults: [
          {
            fileId: 'file-id',
            fileState: 'active',
            fileSystemType: 'Standard',
            fileMetadata: {
              created: 1727354465999,
              updated: 1727354465999,
              isEncrypted: true,
              senderOdinId: 'frodo',
            },
            sharedSecretEncryptedKeyHeader: {
              encryptedAesKey: new Uint8Array(32),
              encryptionVersion: 1,
              iv: new Uint8Array(16),
              type: 2,
            },
          },
        ] as HomebaseFile<string>[],
      } as QueryBatchResponse);
      (queryBatch as jest.Mock) = queryBatchMock;

      const getContentFromHeaderOrPayloadMock = jest
        .fn()
        .mockResolvedValue({ conversationId: 'valid-id' } as ConversationMetadata);
      (getContentFromHeaderOrPayload as jest.Mock) = getContentFromHeaderOrPayloadMock;

      const result = await getConversationMetadata(dotYouClientMock, 'valid-id');

      expect(queryBatchMock).toHaveBeenCalled();
      expect(result).toHaveProperty('fileMetadata');
    });

    it('should return null when queryBatch returns no response', async () => {
      const queryBatchMock = jest.fn().mockResolvedValue(null);
      (queryBatch as jest.Mock) = queryBatchMock;

      const result = await getConversationMetadata(dotYouClientMock, 'valid-id');

      expect(queryBatchMock).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('uploadConversationMetadata', () => {
    it('should upload metadata with valid tags', async () => {
      const uploadFileMock = jest.fn().mockResolvedValue({});
      (uploadFile as jest.Mock) = uploadFileMock;

      const conversation = {
        fileMetadata: {
          appData: {
            tags: ['valid-tag'],
            content: { conversationId: 'valid-tag' },
          },
        },
      } as NewHomebaseFile<ConversationMetadata>;

      await uploadConversationMetadata(dotYouClientMock, conversation);

      expect(uploadFileMock).toHaveBeenCalled();
    });

    it('should throw error when tags are missing', async () => {
      const conversation = {
        fileMetadata: {
          appData: {
            content: { conversationId: 'valid-tag' },
          },
        },
      } as NewHomebaseFile<ConversationMetadata>;

      await expect(uploadConversationMetadata(dotYouClientMock, conversation)).rejects.toThrow(
        'ConversationMetadata must have tags'
      );
    });

    it('should throw error when tags do not match conversationId', async () => {
      const conversation = {
        fileMetadata: {
          appData: {
            tags: ['invalid-tag'],
            content: { conversationId: 'valid-tag' },
          },
        },
      } as NewHomebaseFile<ConversationMetadata>;

      await expect(uploadConversationMetadata(dotYouClientMock, conversation)).rejects.toThrow(
        'ConversationMetadata must have a tag that matches the conversationId'
      );
    });
  });
});
