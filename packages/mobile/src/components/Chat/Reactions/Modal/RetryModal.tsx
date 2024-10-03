import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import React, { forwardRef, memo, useCallback, useMemo } from 'react';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import { ChatMessageIMessage } from '../../ChatDetail';
import { Colors } from '../../../../app/Colors';
import { ConnectionName } from '../../../ui/Name';
import { Text } from '../../../ui/Text/Text';
import { t } from 'homebase-id-app-common';
import { Container } from '../../../ui/Container/Container';
import { StyleSheet } from 'react-native';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { useChatMessage } from '../../../../hooks/chat/useChatMessage';
import { HomebaseFile } from '@homebase-id/js-lib/core';
import { ChatMessage } from '../../../../provider/chat/ChatProvider';
import { UnifiedConversation } from '../../../../provider/chat/ConversationProvider';
import { ErrorNotification } from '../../../ui/Alert/ErrorNotification';
import { Backdrop } from '../../../ui/Modal/Backdrop';
export const RetryModal = forwardRef(
  (
    {
      message,
      conversation,
      onClose,
    }: {
      message: ChatMessageIMessage | undefined;
      conversation: HomebaseFile<UnifiedConversation>;
      onClose: () => void;
    },
    ref: React.Ref<BottomSheetModalMethods>
  ) => {
    const { isDarkMode } = useDarkMode();
    const { mutate, error } = useChatMessage().update;
    const recipients = message?.serverMetadata?.transferHistory?.recipients;

    const onRetry = useCallback(() => {
      if (!message) return;
      mutate({
        updatedChatMessage: message as HomebaseFile<ChatMessage>,
        conversation: conversation,
      });
      onClose();
    }, [conversation, message, mutate, onClose]);

    // loop through the keys and get the recipient that failed
    const failedRecipient = Object.keys(recipients ?? {}).filter((v) => {
      return recipients && !recipients[v].latestSuccessfullyDeliveredVersionTag;
    });

    const renderTitle = useMemo(() => {
      if (recipients && Object.keys(recipients).length === 1 && failedRecipient?.length === 1) {
        return <>Failed to send to {<ConnectionName odinId={failedRecipient[0]} />}</>;
      } else if (recipients && Object.keys(recipients).length === failedRecipient?.length) {
        return 'Failed to send the message';
      } else if (recipients && failedRecipient?.length === 1) {
        const name = <ConnectionName odinId={failedRecipient[0]} />;
        return <>Failed to send to {name}</>;
      }
      return 'Failed to send message to some recipients';
    }, [failedRecipient, recipients]);

    const renderErrorMessage = useMemo(() => {
      if (recipients && Object.keys(recipients).length === 1 && failedRecipient?.length === 1) {
        return recipients[failedRecipient[0]].latestTransferStatus;
      } else if (recipients && Object.keys(recipients).length === failedRecipient?.length) {
        return 'Failed to send the message';
      } else if (recipients && failedRecipient?.length === 1) {
        return recipients[failedRecipient[0]].latestTransferStatus;
      }
    }, [failedRecipient, recipients]);
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['30%']}
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
        <BottomSheetView
          style={{
            flex: 1,
          }}
        >
          <ErrorNotification error={error} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '500',
              color: isDarkMode ? Colors.white : Colors.slate[700],
              alignSelf: 'center',
              marginBottom: 10,
            }}
          >
            {renderTitle}
          </Text>
          <Text style={styles.errorStyle}>{t(renderErrorMessage)}</Text>
          <RetryTile title={'Send Again'} onPress={onRetry} />
          <RetryTile title={'Cancel'} onPress={onClose} />
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const RetryTile = memo(({ title, onPress }: { title: string; onPress: () => void }) => {
  const { isDarkMode } = useDarkMode();
  return (
    <TouchableHighlight
      onPress={onPress}
      underlayColor={isDarkMode ? Colors.slate[700] : Colors.slate[100]}
      style={{
        borderTopWidth: 1,
        borderColor: isDarkMode ? Colors.gray[800] : Colors.gray[200],
        borderBottomWidth: 1,
      }}
    >
      <Container>
        <Text style={styles.buttonTitle}>{title}</Text>
      </Container>
    </TouchableHighlight>
  );
});

const styles = StyleSheet.create({
  errorStyle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.red[500],
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonTitle: {
    fontSize: 16,
    alignSelf: 'center',
    padding: 16,
  },
});
