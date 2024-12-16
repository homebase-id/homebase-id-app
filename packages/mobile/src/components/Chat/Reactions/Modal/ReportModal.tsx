import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import React, { forwardRef, memo } from 'react';
import { useDarkMode } from '../../../../hooks/useDarkMode';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

import { ChatMessageIMessage } from '../../ChatDetail';
import { Colors } from '../../../../app/Colors';
import { Text } from '../../../ui/Text/Text';
import { Container } from '../../../ui/Container/Container';
import { StyleSheet } from 'react-native';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { ApiType, DotYouClient } from '@homebase-id/js-lib/core';

import { Backdrop } from '../../../ui/Modal/Backdrop';
import { AuthorName } from '../../../ui/Name';
import { openURL } from '../../../../utils/utils';
import { useAuth } from '../../../../hooks/auth/useAuth';
export const ReportModal = forwardRef(
  (
    {
      message,
      onClose,
    }: {
      message: ChatMessageIMessage | undefined;
      onClose: () => void;
    },
    ref: React.Ref<BottomSheetModalMethods>
  ) => {
    const { isDarkMode } = useDarkMode();
    const renderTitle = () => {
      return (
        <>
          {'Report'} <AuthorName odinId={message?.fileMetadata.originalAuthor} /> {'?'}
        </>
      );
    };
    const identity = useAuth().getIdentity();
    const host = new DotYouClient({
      api: ApiType.Guest,
      loggedInIdentity: identity || undefined,
      hostIdentity: identity || undefined,
    }).getRoot();

    const onBlock = () =>
      openURL(`${host}/owner/connections/${message?.fileMetadata.originalAuthor}/block`);

    const onReport = () => openURL('https://ravenhosting.cloud/report/content');

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
          <Text
            style={{
              fontSize: 18,
              fontWeight: '500',
              color: isDarkMode ? Colors.white : Colors.slate[700],
              alignSelf: 'center',
              marginBottom: 10,
            }}
          >
            {renderTitle()}
          </Text>
          <ReportTileOption title={'Block'} onPress={onBlock} />
          <ReportTileOption title={'Report'} onPress={onReport} />
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const ReportTileOption = memo(({ title, onPress }: { title: string; onPress: () => void }) => {
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
    color: Colors.red[500],
  },
});
