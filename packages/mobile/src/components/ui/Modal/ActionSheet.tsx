import { ReactNode } from 'react';
import { Modal } from './Modal';
import { View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

export const ActionSheet = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <Modal onClose={onClose}>
      <View style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{children}</View>
    </Modal>
  );
};

export const ActionSheetItem = ({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress: () => void;
}) => {
  return <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
};
