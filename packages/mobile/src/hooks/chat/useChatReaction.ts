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
  EmojiReaction,
  ReactionPreview,
  uploadGroupReaction,
} from '@homebase-id/js-lib/core';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import {
  ChatDrive,
  ConversationMetadata,
  UnifiedConversation,
} from '../../provider/chat/ConversationProvider';
import { ChatMessage } from '../../provider/chat/ChatProvider';
import { getSynchronousDotYouClient } from './getSynchronousDotYouClient';
import { addError } from '../errors/useErrors';
import { getNewId, tryJsonParse } from '@homebase-id/js-lib/helpers';
import { insertNewMessage } from './useChatMessages';

const addReaction = async ({
  conversation,
  message,
  reaction,
}: {
  conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>;
  message: HomebaseFile<ChatMessage>;
  reaction: string;
}) => {
  const dotYouClient = await getSynchronousDotYouClient();
  const conversationContent = conversation.fileMetadata.appData.content;
  const identity = dotYouClient.getLoggedInIdentity();
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
    conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>;
    message: HomebaseFile<ChatMessage>;
    reaction: string;
  }
> = (queryClient) => ({
  mutationKey: ['add-reaction'],
  mutationFn: addReaction,
  onMutate: async ({ message, reaction }) => {
    // Update the reaction overview
    const previousReactions =
      queryClient.getQueryData<EmojiReaction[]>(['chat-reaction', message.fileId]) || [];

    const newReaction: EmojiReaction = {
      authorOdinId: (await getSynchronousDotYouClient()).getLoggedInIdentity(),
      body: reaction,
    };

    queryClient.setQueryData(
      ['chat-reaction', message.fileId],
      [...previousReactions, newReaction]
    );

    // Update the message reaction preview
    const id = getNewId();
    const reactionPreview: ReactionPreview = {
      ...(message.fileMetadata.reactionPreview as ReactionPreview),
      reactions: {
        ...(message.fileMetadata.reactionPreview?.reactions as ReactionPreview['reactions']),
        [id]: {
          key: id,
          count: '1',
          reactionContent: JSON.stringify({ emoji: reaction }),
        },
      },
    };

    const messageWithReactionPreview: HomebaseFile<ChatMessage> = {
      ...message,
      fileMetadata: {
        ...message.fileMetadata,
        reactionPreview,
      },
    };

    insertNewMessage(queryClient, messageWithReactionPreview);
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
  conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>;
  message: HomebaseFile<ChatMessage>;
  reaction: EmojiReaction;
}) => {
  const dotYouClient = await getSynchronousDotYouClient();
  const conversationContent = conversation.fileMetadata.appData.content;
  const identity = dotYouClient.getLoggedInIdentity();
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
    conversation: HomebaseFile<UnifiedConversation, ConversationMetadata>;
    message: HomebaseFile<ChatMessage>;
    reaction: EmojiReaction;
  }
> = (queryClient) => ({
  mutationKey: ['remove-reaction'],
  mutationFn: removeReactionOnServer,
  onMutate: async (variables) => {
    // Update the reaction overview
    const { message, reaction } = variables;
    const previousReactions = queryClient.getQueryData<EmojiReaction[] | undefined>([
      'chat-reaction',
      message.fileId,
    ]);

    if (previousReactions) {
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
    }

    // Update the message reaction preview
    const reactions = message.fileMetadata.reactionPreview?.reactions as
      | ReactionPreview['reactions']
      | undefined;
    if (!reactions) return;

    const reactionKey = Object.keys(reactions).find(
      (key) =>
        tryJsonParse<{ emoji: string }>(reactions[key].reactionContent)?.emoji === reaction.body
    );
    if (!reactionKey) return;

    const reactionPreview: ReactionPreview = {
      ...(message.fileMetadata.reactionPreview as ReactionPreview),
      reactions: {
        ...reactions,
      },
    };

    delete reactionPreview.reactions[reactionKey];

    const messageWithReactionPreview: HomebaseFile<ChatMessage> = {
      ...message,
      fileMetadata: {
        ...message.fileMetadata,
        reactionPreview,
      },
    };

    insertNewMessage(queryClient, messageWithReactionPreview);
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
      refetchOnMount: true,
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
  const currentReactions = queryClient.getQueryData<EmojiReaction[] | undefined>([
    'chat-reaction',
    messageLocalFileId,
  ]);

  if (!currentReactions) {
    queryClient.invalidateQueries({ queryKey: ['chat-reaction', messageLocalFileId] });
    return;
  }

  const reactionAsEmojiReaction: EmojiReaction = {
    authorOdinId: newReaction.odinId,
    body: tryJsonParse<{ emoji: string }>(newReaction.reactionContent).emoji,
  };

  queryClient.setQueryData<EmojiReaction[]>(
    ['chat-reaction', messageLocalFileId],
    [
      ...currentReactions.filter(
        (reaction) =>
          reaction.authorOdinId !== reactionAsEmojiReaction.authorOdinId ||
          reaction.body !== reactionAsEmojiReaction.body
      ),
      reactionAsEmojiReaction,
    ]
  );
};

export const removeReaction = (
  queryClient: QueryClient,
  messageLocalFileId: string,
  removedReaction: GroupEmojiReaction
) => {
  const currentReactions = queryClient.getQueryData<EmojiReaction[] | undefined>([
    'chat-reaction',
    messageLocalFileId,
  ]);

  if (!currentReactions) {
    queryClient.invalidateQueries({ queryKey: ['chat-reaction', messageLocalFileId] });
    return;
  }

  const reactionAsEmojiReaction: EmojiReaction = {
    authorOdinId: removedReaction.odinId,
    body: tryJsonParse<{ emoji: string }>(removedReaction.reactionContent).emoji,
  };

  queryClient.setQueryData<EmojiReaction[]>(
    ['chat-reaction', messageLocalFileId],
    currentReactions.filter(
      (reaction) =>
        reaction.authorOdinId !== reactionAsEmojiReaction.authorOdinId ||
        reaction.body !== reactionAsEmojiReaction.body
    )
  );
};
