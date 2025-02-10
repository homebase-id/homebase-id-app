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
  patchFile,
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
            fileId: 'file-id',
            fileMetadata: { appData: { content: { recipients: [] } }, payloads: [] },
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
        fileId: 'file-id',
        fileMetadata: { appData: { content: { recipients: [] } }, payloads: [] },
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
    const conversation: NewHomebaseFile<UnifiedConversation, ConversationMetadata> = {
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
    const conversation: HomebaseFile<UnifiedConversation, ConversationMetadata> = {
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
      const patchFileMock = jest.fn().mockResolvedValue({});
      (patchFile as jest.Mock) = patchFileMock;

      await updateConversation(dotYouClientMock, conversation);

      expect(patchFileMock).toHaveBeenCalled();
    });

    it('should handle version conflict', async () => {
      const patchFileMock = jest
        .fn()
        .mockImplementation((_, __, ___, ____, _____, ______, _______, conflictHandler) => {
          conflictHandler();
        });
      (patchFile as jest.Mock) = patchFileMock;

      const getConversationMock = jest.fn().mockResolvedValue({
        fileMetadata: { versionTag: 'new-version' },
        sharedSecretEncryptedKeyHeader: {},
      });
      (getConversation as jest.Mock) = getConversationMock;

      await updateConversation(dotYouClientMock, conversation);

      expect(patchFileMock).toHaveBeenCalled();
      expect(getConversationMock).toHaveBeenCalled();
    });
  });
});
