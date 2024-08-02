import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { forwardRef, useCallback } from 'react';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Colors } from '../../../app/Colors';
import { StyleSheet } from 'react-native';
import { Text } from '../../ui/Text/Text';

export const CommentsModal = forwardRef((ref: React.Ref<BottomSheetModalMethods>) => {
  const { isDarkMode } = useDarkMode();
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
      <Text style={styles.headerText}>Forward To</Text>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  headerText: {
    textAlign: 'center',
    margin: 6,
    fontSize: 16,
    fontWeight: '500',
  },
});
