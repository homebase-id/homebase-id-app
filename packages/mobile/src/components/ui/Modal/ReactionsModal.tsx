import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { Text, View } from 'react-native';
import { Colors } from '../../../app/Colors';
import { useDarkMode } from '../../../hooks/useDarkMode';

import { ChatMessageIMessage } from '../../../pages/chat-page';
import { useChatReaction } from '../../../hooks/chat/useChatReaction';
import { DriveSearchResult } from '@youfoundation/js-lib/dist';
import { ChatReaction } from '../../../provider/chat/ChatReactionProvider';
import useContact from '../../../hooks/contact/useContact';
import { Avatar, OwnerAvatar } from '../Chat/Conversation-tile';

export const ReactionsModal = forwardRef(
  (
    { message, onClose }: { message: ChatMessageIMessage | undefined; onClose: () => void },
    ref
  ) => {
    const { isDarkMode } = useDarkMode();
    const { data: reactions } = useChatReaction({
      messageId: message?.fileMetadata.appData.uniqueId,
      conversationId: message?.fileMetadata.appData.groupId,
    }).get;

    return (
      <BottomSheetModal
        ref={ref as any}
        snapPoints={['50%']}
        onDismiss={onClose}
        backgroundStyle={{
          backgroundColor: isDarkMode ? Colors.gray[900] : Colors.white,
        }}
      >
        <View
          style={{
            paddingHorizontal: 10,
            flex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: isDarkMode ? Colors.white : Colors.slate[700],
              marginBottom: 10,
            }}
          >
            Reactions
          </Text>
          <BottomSheetScrollView>
            {reactions?.map((prop) => <ReactionTile key={prop.fileId} {...prop} />)}
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    );
  }
);

const ReactionTile = (prop: DriveSearchResult<ChatReaction>) => {
  const reaction = prop.fileMetadata.appData.content.message;
  const senderOdinId = prop.fileMetadata.senderOdinId;
  const contact = useContact(senderOdinId).fetch.data;
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
      }}
    >
      {senderOdinId ? (
        <Avatar
          odinId={senderOdinId}
          style={{
            width: 30,
            height: 30,
            marginRight: 10,
          }}
        />
      ) : (
        <OwnerAvatar
          style={{
            width: 36,
            height: 36,
            marginRight: 10,
          }}
        />
      )}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '500',
          color: isDarkMode ? Colors.white : Colors.slate[700],
        }}
      >
        {!senderOdinId
          ? ' You'
          : contact?.fileMetadata.appData.content.name?.displayName || senderOdinId}
      </Text>
      <Text
        style={{
          flex: 1,
          textAlign: 'right',
          fontSize: 24,
        }}
      >
        {reaction}
      </Text>
    </View>
  );
};