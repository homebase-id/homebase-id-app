import { getPayloadAsJson, RichText } from '@homebase-id/js-lib/core';
import { t, useDotYouClientContext } from 'homebase-id-app-common';
import { ChatDrive } from '../../provider/chat/ConversationProvider';
import { generateClientError } from '../errors/useErrors';
import { useQuery } from '@tanstack/react-query';
import { addLogs } from '../../provider/log/logger';

export const useChatMessagePayload = ({
  fileId,
  payloadKey,
}: {
  fileId?: string | undefined;
  payloadKey?: string | undefined;
}) => {
  const dotYouClient = useDotYouClientContext();

  const getExpandedMessage = async (fileId: string | undefined, payloadKey: string | undefined) => {
    if (!fileId || !payloadKey) {
      return null;
    }
    const extendedMessage = await getPayloadAsJson<{
      message: string | RichText;
    }>(dotYouClient, ChatDrive, fileId, payloadKey);
    if (!extendedMessage) {
      return null;
    }
    return extendedMessage;
  };
  return {
    getExpanded: useQuery({
      queryKey: ['chat-message-expanded', fileId, payloadKey],
      queryFn: () => getExpandedMessage(fileId, payloadKey),
      enabled: !!fileId && !!payloadKey,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      throwOnError: (error, _) => {
        const newError = generateClientError(
          error,
          t('Failed to get the chat message payload extended Message')
        );
        addLogs(newError);
        return false;
      },
    }),
  };
};
