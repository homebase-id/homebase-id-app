import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback } from 'react';
import { Text, View } from 'react-native';
import { Colors } from '../../../../app/Colors';
import { useDarkMode } from '../../../../hooks/useDarkMode';

import { ChatMessageIMessage } from '../../ChatDetail';
import { useChatReaction } from '../../../../hooks/chat/useChatReaction';
import { ReactionFile } from '@homebase-id/js-lib/core';
import { Avatar, OwnerAvatar } from '../../../ui/Avatars/Avatar';
import { AuthorName } from '../../../ui/Name';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

export const ReactionsModal = forwardRef(
  (
    { message, onClose }: { message: ChatMessageIMessage | undefined; onClose: () => void },
    ref: React.Ref<BottomSheetModalMethods>
  ) => {
    const { isDarkMode } = useDarkMode();
    const { data: reactions } = useChatReaction({
      messageFileId: message?.fileId,
      messageGlobalTransitId: message?.fileMetadata.globalTransitId,
    }).get;

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} opacity={0.5} appearsOnIndex={0} disappearsOnIndex={-1} />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['50%']}
        backdropComponent={renderBackdrop}
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
          <BottomSheetScrollView>
            {reactions?.map((prop) => (
              <ReactionTile key={prop.authorOdinId + prop.body} {...prop} />
            ))}
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    );
  }
);

const ReactionTile = (prop: ReactionFile) => {
  const reaction = prop.body;
  const senderOdinId = prop.authorOdinId;
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
      {senderOdinId ? (
        <Avatar
          odinId={senderOdinId}
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
          <AuthorName odinId={senderOdinId} showYou />
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
