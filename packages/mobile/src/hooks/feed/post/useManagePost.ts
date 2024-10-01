import { InfiniteData, MutationOptions, QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PostContent,
  getPost,
  removePost,
} from '@homebase-id/js-lib/public';
import { savePost as savePostFile } from '../../../provider/feed/RNPostUploadProvider';
import {
  HomebaseFile,
  MediaFile,
  MultiRequestCursoredResult,
  NewHomebaseFile,
  UploadResult,
} from '@homebase-id/js-lib/core';

import { TransitUploadResult } from '@homebase-id/js-lib/peer';
import { LinkPreview } from '@homebase-id/js-lib/media';
import { getRichTextFromString, t, useDotYouClientContext } from 'feed-app-common';
import { ImageSource } from '../../../provider/image/RNImageProvider';
import { getSynchronousDotYouClient } from '../../chat/getSynchronousDotYouClient';
import { addError } from '../../errors/useErrors';

const savePost = async ({
  postFile,
  odinId,
  channelId,
  mediaFiles,
  linkPreviews,
  onUpdate,
}: {
  postFile: NewHomebaseFile<PostContent> | HomebaseFile<PostContent>;
  odinId?: string;
  channelId: string;
  mediaFiles?: (ImageSource | MediaFile)[];
  linkPreviews?: LinkPreview[];
  onUpdate?: (phase: string, progress: number) => void;
}) => {
  const dotYouClient = await getSynchronousDotYouClient();
  const onVersionConflict = odinId ? undefined : async (): Promise<UploadResult | TransitUploadResult | undefined> => {
    const serverPost = await getPost<PostContent>(
      dotYouClient,
      channelId,
      postFile.fileMetadata.appData.content.id
    );
    if (!serverPost) return;

    const newPost: HomebaseFile<PostContent> = {
      ...serverPost,
      fileMetadata: {
        ...serverPost.fileMetadata,
        appData: {
          ...serverPost.fileMetadata.appData,
          content: {
            ...serverPost.fileMetadata.appData.content,
            ...postFile.fileMetadata.appData.content,
          },
        },
      },
    };
    return savePostFile(dotYouClient, newPost, odinId, channelId, mediaFiles, linkPreviews, onVersionConflict);
  };
  postFile.fileMetadata.appData.content.captionAsRichText = getRichTextFromString(
    postFile.fileMetadata.appData.content.caption.trim()
  );
  return savePostFile(dotYouClient, postFile, odinId, channelId, mediaFiles, linkPreviews, onVersionConflict, onUpdate);
};

export const getSavePostMutationOptions: (queryClient: QueryClient) => MutationOptions<
  UploadResult | TransitUploadResult,
  unknown,
  {
    postFile: NewHomebaseFile<PostContent> | HomebaseFile<PostContent>;
    channelId: string;
    mediaFiles?: (ImageSource | MediaFile)[];
    linkPreviews?: LinkPreview[];
    onUpdate?: (phase: string, progress: number) => void;
  },
  {
    newPost: {
      postFile: NewHomebaseFile<PostContent> | HomebaseFile<PostContent>;
      channelId: string;
      mediaFiles?: (ImageSource | MediaFile)[] | undefined;
      linkPreviews?: LinkPreview[] | undefined;
      onUpdate?: ((phase: string, progress: number) => void) | undefined;
    };
    previousFeed:
    | InfiniteData<MultiRequestCursoredResult<HomebaseFile<PostContent>[]>, unknown>
    | undefined;
  }
> = (queryClient) => ({
  mutationKey: ['save-post'],
  mutationFn: savePost,
  onSuccess: (_data, variables) => {
    if (variables.postFile.fileMetadata.appData.content.slug) {
      queryClient.invalidateQueries({
        queryKey: ['blog', variables.postFile.fileMetadata.appData.content.slug],
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['blog'] });
    }

    // Too many invalidates, but during article creation, the slug is not known
    queryClient.invalidateQueries({ queryKey: ['blog', variables.postFile.fileId] });
    queryClient.invalidateQueries({
      queryKey: ['blog', variables.postFile.fileMetadata.appData.content.id],
    });
    queryClient.invalidateQueries({
      queryKey: ['blog', variables.postFile.fileMetadata.appData.content.id?.replaceAll('-', '')],
    });

    queryClient.invalidateQueries({
      queryKey: ['blogs', variables.postFile.fileMetadata.appData.content.channelId || '', ''],
    });
    queryClient.invalidateQueries({
      queryKey: ['blogs', '', ''],
    });

    // Update versionTag of post in social feeds cache
    const previousFeed:
      | InfiniteData<MultiRequestCursoredResult<HomebaseFile<PostContent>[]>>
      | undefined = queryClient.getQueryData(['social-feeds']);

    if (previousFeed) {
      const newFeed = { ...previousFeed };
      newFeed.pages[0].results = newFeed.pages[0].results.map((post) =>
        post.fileMetadata.appData.content.id === variables.postFile.fileMetadata.appData.content.id
          ? {
            ...post,
            fileMetadata: {
              ...post.fileMetadata,
              versionTag: (_data as UploadResult).newVersionTag || post.fileMetadata.versionTag,
            },
          }
          : post
      );

      queryClient.setQueryData(['social-feeds'], newFeed);
    }
  },
  onMutate: async (newPost) => {
    await queryClient.cancelQueries({ queryKey: ['social-feeds'] });

    // Update section attributes
    const previousFeed:
      | InfiniteData<MultiRequestCursoredResult<HomebaseFile<PostContent>[]>>
      | undefined = queryClient.getQueryData(['social-feeds']);

    if (previousFeed) {
      const newPostFile: HomebaseFile<PostContent> = {
        ...newPost.postFile,
        fileMetadata: {
          ...newPost.postFile.fileMetadata,
          appData: {
            ...newPost.postFile.fileMetadata.appData,
            content: {
              ...newPost.postFile.fileMetadata.appData.content,

              primaryMediaFile: {
                fileKey: (newPost.mediaFiles?.[0] as MediaFile)?.key,
                type: (newPost.mediaFiles?.[0] as MediaFile)?.contentType,
              },
            },
          },
        },
      } as HomebaseFile<PostContent>;

      const newFeed: InfiniteData<MultiRequestCursoredResult<HomebaseFile<PostContent>[]>> = {
        ...previousFeed,
        pages: previousFeed.pages.map((page, index) => {
          return {
            ...page,
            results: [...(index === 0 ? [newPostFile] : []), ...page.results],
          };
        }),
      };

      queryClient.setQueryData(['social-feeds'], newFeed);
    }

    return { newPost, previousFeed };
  },
  onError: (err, _newCircle, context) => {
    addError(queryClient, err, t('Failed to save post'));

    // Revert local caches to what they were,

    queryClient.setQueryData(['social-feeds'], context?.previousFeed);
  },
  onSettled: () => {
    // Invalidate with a small delay to allow the server to update
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['social-feeds'] });
    }, 1000);
  },
});

export const useManagePost = () => {
  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();



  // const duplicatePost = async ({
  //     toDuplicatePostFile,
  //     channelId,
  //     newPostId,
  //     odinId,
  //     targetChannel,
  // }: {
  //     toDuplicatePostFile: HomebaseFile<PostContent>;
  //     channelId: string;
  //     newPostId: string;
  //     odinId?: string;
  //     targetChannel: HomebaseFile<ChannelDefinition> | NewHomebaseFile<ChannelDefinition>;
  // }) => {
  //     const currentTargetDrive = GetTargetDriveFromChannelId(channelId);

  //     // Fetch payloads from the original post
  //     const mediaFiles: NewMediaFile[] = (
  //         await Promise.all(
  //             toDuplicatePostFile.fileMetadata.payloads.map(async (payload) => {
  //                 const bytes = await getPayloadBytes(
  //                     dotYouClient,
  //                     currentTargetDrive,
  //                     toDuplicatePostFile.fileId,
  //                     payload.key
  //                 );
  //                 if (!bytes) return;
  //                 return {
  //                     file: new Blob([bytes.bytes], { type: payload.contentType }),
  //                     key: payload.key,
  //                     thumbnail: payload.previewThumbnail,
  //                 };
  //             })
  //         )
  //     ).filter(Boolean) as NewMediaFile[];

  //     // Save everything to a new post
  //     const postFile: NewHomebaseFile<PostContent> = {
  //         ...toDuplicatePostFile,
  //         fileId: undefined, // Clear FileId
  //         fileMetadata: {
  //             ...toDuplicatePostFile.fileMetadata,
  //             appData: {
  //                 ...toDuplicatePostFile.fileMetadata.appData,
  //                 fileType: BlogConfig.DraftPostFileType,
  //                 uniqueId: undefined, // Clear UniqueId
  //                 content: {
  //                     ...toDuplicatePostFile.fileMetadata.appData.content,
  //                     id: newPostId,
  //                     channelId: targetChannel.fileMetadata.appData.uniqueId as string,
  //                 },
  //             },
  //         },
  //         serverMetadata: targetChannel.serverMetadata || {
  //             accessControlList: { requiredSecurityGroup: SecurityGroupType.Owner },
  //         },
  //     };

  //     return savePostFile(
  //         dotYouClient,
  //         postFile,
  //         odinId,
  //         targetChannel.fileMetadata.appData.uniqueId as string,
  //         mediaFiles
  //     );
  // };

  // slug property is need to clear the cache later, but not for the actual removeData
  const removeData = async ({
    postFile,
    channelId,
  }: {
    postFile: HomebaseFile<PostContent>;
    channelId: string;
  }) => {
    if (postFile) return await removePost(dotYouClient, postFile, channelId);
  };

  return {
    save: useMutation({
      mutationFn: savePost,
      onSuccess: (_data, variables) => {
        if (variables.postFile.fileMetadata.appData.content.slug) {
          queryClient.invalidateQueries({
            queryKey: ['blog', variables.postFile.fileMetadata.appData.content.slug],
            exact: false,
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['blog'], exact: false });
        }

        // Too many invalidates, but during article creation, the slug is not known
        queryClient.invalidateQueries({ queryKey: ['blog', variables.postFile.fileId] });
        queryClient.invalidateQueries({
          queryKey: ['blog', variables.postFile.fileMetadata.appData.content.id],
        });
        queryClient.invalidateQueries({
          queryKey: [
            'blog',
            variables.postFile.fileMetadata.appData.content.id?.replaceAll('-', ''),
          ],
        });

        queryClient.invalidateQueries({
          queryKey: ['blogs', variables.postFile.fileMetadata.appData.content.channelId || ''],
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: ['blogs', ''],
          exact: false,
        });

        // Update versionTag of post in social feeds cache
        const previousFeed:
          | InfiniteData<MultiRequestCursoredResult<HomebaseFile<PostContent>[]>>
          | undefined = queryClient.getQueryData(['social-feeds']);

        if (previousFeed) {
          const newFeed = { ...previousFeed };
          newFeed.pages[0].results = newFeed.pages[0].results.map((post) =>
            post.fileMetadata.appData.content.id ===
              variables.postFile.fileMetadata.appData.content.id
              ? {
                ...post,
                fileMetadata: {
                  ...post.fileMetadata,
                  versionTag:
                    (_data as UploadResult).newVersionTag || post.fileMetadata.versionTag,
                },
              }
              : post
          );

          queryClient.setQueryData(['social-feeds'], newFeed);
        }
      },
      onMutate: async (newPost) => {
        await queryClient.cancelQueries({ queryKey: ['social-feeds'] });

        // Update section attributes
        const previousFeed:
          | InfiniteData<MultiRequestCursoredResult<HomebaseFile<PostContent>[]>>
          | undefined = queryClient.getQueryData(['social-feeds']);

        if (previousFeed) {
          const newPostFile: HomebaseFile<PostContent> = {
            ...newPost.postFile,
            fileMetadata: {
              ...newPost.postFile.fileMetadata,
              senderOdinId: newPost.odinId,
              appData: {
                ...newPost.postFile.fileMetadata.appData,
                content: {
                  ...newPost.postFile.fileMetadata.appData.content,
                  primaryMediaFile: newPost.mediaFiles?.[0]
                    ? {
                      fileKey: newPost.mediaFiles?.[0].key,
                      type: (newPost.mediaFiles?.[0] as MediaFile)?.contentType,
                    }
                    : undefined,
                },
              },
            },
          } as HomebaseFile<PostContent>;

          const newFeed: InfiniteData<MultiRequestCursoredResult<HomebaseFile<PostContent>[]>> = {
            ...previousFeed,
            pages: previousFeed.pages.map((page, index) => {
              return {
                ...page,
                results: [...(index === 0 ? [newPostFile] : []), ...page.results],
              };
            }),
          };

          queryClient.setQueryData(['social-feeds'], newFeed);
        }

        return { newPost, previousFeed };
      },
      onError: (err, _newCircle, context) => {
        console.error(err);

        // Revert local caches to what they were,

        queryClient.setQueryData(['social-feeds'], context?.previousFeed);
      },
      onSettled: () => {
        // Invalidate with a small delay to allow the server to update
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['social-feeds'] });
        }, 1000);
      },
    }),

    update: useMutation({
      mutationFn: savePost,
      onSuccess: (_data, variables) => {
        if (variables.postFile.fileMetadata.appData.content.slug) {
          queryClient.invalidateQueries({
            queryKey: ['blog', variables.postFile.fileMetadata.appData.content.slug],
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['blog'] });
        }

        // Too many invalidates, but during article creation, the slug is not known
        queryClient.invalidateQueries({ queryKey: ['blog', variables.postFile.fileId] });
        queryClient.invalidateQueries({
          queryKey: ['blog', variables.postFile.fileMetadata.appData.content.id],
        });
        queryClient.invalidateQueries({
          queryKey: [
            'blog',
            variables.postFile.fileMetadata.appData.content.id?.replaceAll('-', ''),
          ],
        });

        queryClient.invalidateQueries({
          queryKey: ['blogs', variables.postFile.fileMetadata.appData.content.channelId || ''],
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: ['blogs', ''],
          exact: false,
        });

        // Update versionTag of post in social feeds cache
        const previousFeed:
          | InfiniteData<MultiRequestCursoredResult<HomebaseFile<PostContent>[]>>
          | undefined = queryClient.getQueryData(['social-feeds']);

        if (previousFeed) {
          const newFeed = { ...previousFeed };
          newFeed.pages[0].results = newFeed.pages[0].results.map((post) =>
            post.fileMetadata.appData.content.id ===
              variables.postFile.fileMetadata.appData.content.id
              ? {
                ...post,
                fileMetadata: {
                  ...post.fileMetadata,
                  versionTag:
                    (_data as UploadResult).newVersionTag || post.fileMetadata.versionTag,
                },
              }
              : post
          );

          queryClient.setQueryData(['social-feeds'], newFeed);
        }
      },
      onError: (err) => {
        console.error(err);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['social-feeds'] });
      },
    }),

    remove: useMutation({
      mutationFn: removeData,
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['social-feeds'] });

        if (variables && variables.postFile.fileMetadata.appData.content.slug) {
          queryClient.invalidateQueries({
            queryKey: ['blog', variables.postFile.fileMetadata.appData.content.slug],
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['blog'] });
        }

        queryClient.invalidateQueries({
          queryKey: ['blogs', variables.postFile.fileMetadata.appData.content.channelId || ''],
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: ['blogs', ''],
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: ['drafts'],
        });
      },
    }),

    //TODO: Implement duplicate
    // duplicate: useMutation({
    //     mutationFn: duplicatePost,
    //     // No optimistic mutation as it directly navigates after success; And as such would lose the cache
    // }),
  };
};
