import { savePost } from '../src/provider/feed/RNPostUploadProvider';
import { ApiType, DotYouClient, HomebaseFile, MediaFile, NewHomebaseFile, SecurityGroupType, TransferStatus, TransferUploadStatus, uploadFile, UploadResult } from '@homebase-id/js-lib/core';
import { ImageSource } from '../src/provider/image/RNImageProvider';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { getRandom16ByteArray } from '@homebase-id/js-lib/helpers';
import { BlogConfig, PostContent } from '@homebase-id/js-lib/public';

jest.mock('@homebase-id/js-lib/core');
jest.mock('../src/provider/image/RNImageProvider');
jest.mock('../src/provider/video/RNVideoProcessor');
jest.mock('axios');

describe('RNPostUploadProvider', () => {
    let file: HomebaseFile<PostContent> | NewHomebaseFile<PostContent>;
    let channelId: string;
    let toSaveFiles: (ImageSource | MediaFile)[];
    let linkPreviews: LinkPreview[];
    let onVersionConflict: jest.Mock;
    let onUpdate: jest.Mock;
    const dotYouClient = new DotYouClient({
        identity: 'frodobaggins.me',
        api: ApiType.App,
        headers: {},
        sharedSecret: new Uint8Array(32),
    });

    beforeEach(() => {
        const mockGetRandom16Bytes = jest.fn().mockReturnValue(new Uint8Array(16));
        (getRandom16ByteArray as jest.Mock) = mockGetRandom16Bytes;
        dotYouClient.getIdentity = jest.fn().mockReturnValue('frodobaggins.me');
        dotYouClient.getSharedSecret = jest.fn().mockReturnValue(new Uint8Array(32));

        file = {
            fileId: 'new-file-id',
            fileMetadata: {
                appData: {

                    content: {
                        authorOdinId: dotYouClient.getIdentity(),
                        // type: mediaFiles && mediaFiles.length > 1 ? 'Media' : 'Tweet',
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
                    requiredSecurityGroup: SecurityGroupType.Authenticated,
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
        const result: UploadResult = { fileId: 'new-file-id' };

        (uploadFile as jest.Mock).mockResolvedValue(result);

        const uploadResult = await savePost(dotYouClient, file, channelId, toSaveFiles, linkPreviews, onVersionConflict, onUpdate);

        expect(uploadResult).toEqual(result);
        expect(file.fileMetadata.appData.content.id).toBeTruthy();
        expect(file.fileMetadata.appData.content.authorOdinId).toBe('author-odin-id');
    });

    it('should update an existing post', async () => {
        file.fileId = 'existing-file-id';
        file.fileMetadata.appData.content.id = 'existing-content-id';
        const result: UploadResult = { fileId: 'existing-file-id' };

        (uploadFile as jest.Mock).mockResolvedValue(result);

        const uploadResult = await savePost(dotYouClient, file, channelId, toSaveFiles, linkPreviews, onVersionConflict, onUpdate);

        expect(uploadResult).toEqual(result);
        expect(file.fileMetadata.appData.content.authorOdinId).toBe('author-odin-id');
    });

    it('should handle version conflict', async () => {
        file.fileId = 'existing-file-id';
        file.fileMetadata.appData.content.id = 'existing-content-id';

        (uploadFile as jest.Mock).mockRejectedValue(new Error('Version conflict'));

        await expect(savePost(dotYouClient, file, channelId, toSaveFiles, linkPreviews, onVersionConflict, onUpdate)).rejects.toThrow('Version conflict');
        expect(onVersionConflict).toHaveBeenCalled();
    });

    it('should handle missing ACL', async () => {
        file.serverMetadata?.accessControlList = undefined;

        await expect(savePost(dotYouClient, file, channelId, toSaveFiles, linkPreviews, onVersionConflict, onUpdate)).rejects.toThrow('ACL is required to save a post');
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

        const result: UploadResult = { fileId: 'new-file-id' };

        (uploadFile as jest.Mock).mockResolvedValue(result);

        const uploadResult = await savePost(dotYouClient, file, channelId, toSaveFiles, linkPreviews, onVersionConflict, onUpdate);

        expect(uploadResult).toEqual(result);
        expect(file.fileMetadata.appData.content.id).toBeTruthy();
        expect(file.fileMetadata.appData.content.authorOdinId).toBe('author-odin-id');
    });
});
