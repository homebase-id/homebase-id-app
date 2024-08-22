import {
  QueryClient,
  UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  deleteGroupReaction,
  getGroupReactions,
  GroupEmojiReaction,
  HomebaseFile,
  ReactionFile,
  uploadGroupReaction,
} from '@youfoundation/js-lib/core';
import { t, useDotYouClientContext } from 'feed-app-common';
import { ChatDrive, UnifiedConversation } from '../../provider/chat/ConversationProvider';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { getSynchronousDotYouClient } from './getSynchronousDotYouClient';
import { addError } from '../errors/useErrors';
import { tryJsonParse } from '@youfoundation/js-lib/helpers';

const addReaction = async ({
  conversation,
  message,
  reaction,
}: {
  conversation: HomebaseFile<UnifiedConversation>;
  message: HomebaseFile<ChatMessage>;
  reaction: string;
}) => {
  const dotYouClient = await getSynchronousDotYouClient();
  const conversationContent = conversation.fileMetadata.appData.content;
  const identity = dotYouClient.getIdentity();
  const recipients = conversationContent.recipients.filter((recipient) => recipient !== identity);

  if (!message.fileMetadata.globalTransitId) {
    throw new Error('Message does not have a global transit id');
  }

  return await uploadGroupReaction(
    dotYouClient,
    ChatDrive,
    message.fileMetadata.globalTransitId,
    reaction,
    recipients
  );
};

export const getAddReactionMutationOptions: (queryClient: QueryClient) => UseMutationOptions<
  unknown,
  unknown,
  {
    conversation: HomebaseFile<UnifiedConversation>;
    message: HomebaseFile<ChatMessage>;
    reaction: string;
  }
> = (queryClient) => ({
  mutationKey: ['add-reaction'],
  mutationFn: addReaction,
  onMutate: async (variables) => {
    const { message } = variables;
    const previousReactions =
      queryClient.getQueryData<ReactionFile[]>(['chat-reaction', message.fileId]) || [];

    const newReaction: ReactionFile = {
      authorOdinId: (await getSynchronousDotYouClient()).getIdentity(),
      body: variables.reaction,
    };

    queryClient.setQueryData(
      ['chat-reaction', message.fileId],
      [...previousReactions, newReaction]
    );
  },
  onSettled: (data, error, variables) => {
    queryClient.invalidateQueries({
      queryKey: ['chat-reaction', variables.message.fileId],
    });
  },
  onError: (err) => addError(queryClient, err, t('Failed to add reaction')),
});

const removeReactionOnServer = async ({
  conversation,
  message,
  reaction,
}: {
  conversation: HomebaseFile<UnifiedConversation>;
  message: HomebaseFile<ChatMessage>;
  reaction: ReactionFile;
}) => {
  const dotYouClient = await getSynchronousDotYouClient();
  const conversationContent = conversation.fileMetadata.appData.content;
  const identity = dotYouClient.getIdentity();
  const recipients = conversationContent.recipients.filter((recipient) => recipient !== identity);

  if (!message.fileMetadata.globalTransitId) {
    throw new Error('Message does not have a global transit id');
  }

  return await deleteGroupReaction(dotYouClient, ChatDrive, recipients, reaction, {
    fileId: message.fileId,
    globalTransitId: message.fileMetadata.globalTransitId,
    targetDrive: ChatDrive,
  });
};

export const getRemoveReactionMutationOptions: (queryClient: QueryClient) => UseMutationOptions<
  unknown,
  unknown,
  {
    conversation: HomebaseFile<UnifiedConversation>;
    message: HomebaseFile<ChatMessage>;
    reaction: ReactionFile;
  }
> = (queryClient) => ({
  mutationKey: ['remove-reaction'],
  mutationFn: removeReactionOnServer,
  onMutate: async (variables) => {
    const { message, reaction } = variables;
    const previousReactions = queryClient.getQueryData<ReactionFile[] | undefined>([
      'chat-reaction',
      message.fileId,
    ]);

    if (!previousReactions) return;

    queryClient.setQueryData(
      ['chat-reaction', message.fileId],
      [
        ...previousReactions.filter(
          (existingReaction) =>
            existingReaction.authorOdinId !== reaction.authorOdinId ||
            existingReaction.body !== reaction.body
        ),
      ]
    );
  },
  onSettled: (data, error, variables) => {
    queryClient.invalidateQueries({
      queryKey: ['chat-reaction', variables.message.fileId],
    });
  },

  onError: (err) => addError(queryClient, err, t('Failed to remove reaction')),
});

export const useChatReaction = (props?: {
  messageGlobalTransitId: string | undefined;
  messageFileId: string | undefined;
}) => {
  const { messageGlobalTransitId, messageFileId } = props || {};

  const dotYouClient = useDotYouClientContext();
  const queryClient = useQueryClient();

  const getReactionsByMessageGlobalTransitId = (messageGlobalTransitId: string) => async () => {
    const reactions =
      (
        await getGroupReactions(dotYouClient, {
          target: {
            globalTransitId: messageGlobalTransitId,
            targetDrive: ChatDrive,
          },
        })
      )?.reactions || [];

    return reactions;
  };

  return {
    get: useQuery({
      queryKey: ['chat-reaction', messageFileId],
      queryFn: getReactionsByMessageGlobalTransitId(messageGlobalTransitId as string),
      enabled: !!messageGlobalTransitId && !!messageFileId,
      staleTime: 1000 * 60 * 10, // 10 min
    }),
    add: useMutation(getAddReactionMutationOptions(queryClient)),
    remove: useMutation(getRemoveReactionMutationOptions(queryClient)),
  };
};

export const insertNewReaction = (
  queryClient: QueryClient,
  messageLocalFileId: string,
  newReaction: GroupEmojiReaction
) => {
  const currentReactions = queryClient.getQueryData<ReactionFile[] | undefined>([
    'chat-reaction',
    messageLocalFileId,
  ]);

  if (!currentReactions) {
    queryClient.invalidateQueries({ queryKey: ['chat-reaction', messageLocalFileId] });
    return;
  }

  const reactionAsReactionFile: ReactionFile = {
    authorOdinId: newReaction.odinId,
    body: tryJsonParse<{ emoji: string }>(newReaction.reactionContent).emoji,
  };

  queryClient.setQueryData<ReactionFile[]>(
    ['chat-reaction', messageLocalFileId],
    [
      ...currentReactions.filter(
        (reaction) =>
          reaction.authorOdinId !== reactionAsReactionFile.authorOdinId ||
          reaction.body !== reactionAsReactionFile.body
      ),
      reactionAsReactionFile,
    ]
  );
};

export const removeReaction = (
  queryClient: QueryClient,
  messageLocalFileId: string,
  removedReaction: GroupEmojiReaction
) => {
  const currentReactions = queryClient.getQueryData<ReactionFile[] | undefined>([
    'chat-reaction',
    messageLocalFileId,
  ]);

  if (!currentReactions) {
    queryClient.invalidateQueries({ queryKey: ['chat-reaction', messageLocalFileId] });
    return;
  }

  const reactionAsReactionFile: ReactionFile = {
    authorOdinId: removedReaction.odinId,
    body: tryJsonParse<{ emoji: string }>(removedReaction.reactionContent).emoji,
  };

  queryClient.setQueryData<ReactionFile[]>(
    ['chat-reaction', messageLocalFileId],
    currentReactions.filter(
      (reaction) =>
        reaction.authorOdinId !== reactionAsReactionFile.authorOdinId ||
        reaction.body !== reactionAsReactionFile.body
    )
  );
};
