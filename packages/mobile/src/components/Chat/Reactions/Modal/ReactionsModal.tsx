import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, memo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Colors } from '../../../../app/Colors';
import { useDarkMode } from '../../../../hooks/useDarkMode';

import { ChatMessageIMessage } from '../../ChatDetail';
import { useChatReaction } from '../../../../hooks/chat/useChatReaction';

import { Avatar, OwnerAvatar } from '../../../ui/Avatars/Avatar';
import { AuthorName } from '../../../ui/Name';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { Backdrop } from '../../../ui/Modal/Backdrop';

export const ReactionsModal = memo(
  forwardRef(
    (
      { message, onClose }: { message: ChatMessageIMessage | undefined; onClose: () => void },
      ref: React.Ref<BottomSheetModalMethods>
    ) => {
      const { isDarkMode } = useDarkMode();
      const { data: reactions, isLoading } = useChatReaction({
        messageId: message?.fileMetadata.appData.uniqueId,
        conversationId: message?.fileMetadata.appData.groupId,
      }).get;

      return (
        <BottomSheetModal
          ref={ref}
          snapPoints={['50%']}
          backdropComponent={Backdrop}
          onDismiss={onClose}
          enableDismissOnClose={true}
          enablePanDownToClose
          index={0}
          backgroundStyle={{
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.slate[50],
          }}
          handleIndicatorStyle={{
            backgroundColor: isDarkMode ? Colors.gray[100] : Colors.gray[500],
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
            {isLoading ? (
              <ActivityIndicator
                size={'large'}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              />
            ) : (
              <BottomSheetScrollView>
                {reactions?.map((prop) => (
                  <ReactionTile
                    key={prop.fileId}
                    reaction={prop.fileMetadata.appData.content.message}
                    authorOdinId={prop.fileMetadata.senderOdinId}
                  />
                ))}
              </BottomSheetScrollView>
            )}
          </View>
        </BottomSheetModal>
      );
    }
  )
);

export const ReactionTile = ({
  reaction,
  authorOdinId,
}: {
  reaction: string;
  authorOdinId?: string;
}) => {
  const { isDarkMode } = useDarkMode();
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
      }}
    >
      {authorOdinId ? (
        <Avatar
          odinId={authorOdinId}
          imageSize={{ width: 42, height: 42 }}
          style={{
            marginRight: 16,
            width: 42,
            height: 42,
          }}
        />
      ) : (
        <OwnerAvatar
          imageSize={{ width: 42, height: 42 }}
          style={{
            marginRight: 16,
            width: 42,
            height: 42,
          }}
        />
      )}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '500',
            color: isDarkMode ? Colors.white : Colors.slate[700],
          }}
        >
          <AuthorName odinId={authorOdinId} showYou />
        </Text>
        <Text
          style={{
            fontSize: 24,
            color: isDarkMode ? Colors.white : Colors.slate[700],
          }}
        >
          {reaction}
        </Text>
      </View>
    </View>
  );
};
