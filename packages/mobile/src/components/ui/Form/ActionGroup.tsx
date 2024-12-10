import { useState, FC, ReactNode } from 'react';
import { StyleProp, ViewStyle, View, TouchableOpacity, StyleSheet } from 'react-native';

import { IconProps } from '../Icons/icons';
import { Colors } from '../../../app/Colors';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Text } from '../Text/Text';
import Dialog from 'react-native-dialog';
import { BlurView } from '@react-native-community/blur';

interface SelectProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;

  options: {
    label: string;
    onPress: () => void;
    icon?: FC<IconProps>;
    confirmOptions?: {
      title: string;
      body: string;
      buttonText: string;
    };
  }[];
}

export const ActionGroup = ({ children, style, options }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode } = useDarkMode();
  const [dialogVisible, setDialogVisible] = useState(false);

  const blurComponentIOS = (
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType={isDarkMode ? 'dark' : 'light'}
      blurAmount={50}
    />
  );

  return (
    <View style={[{ position: 'relative' }, style]}>
      <TouchableOpacity onPress={() => setIsOpen((_isOpen) => !_isOpen)}>
        {children}
      </TouchableOpacity>

      {isOpen ? (
        <View
          style={{
            position: 'absolute',
            top: 22,
            minWidth: 180,
            left: 0,
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            zIndex: 20,
            elevation: 20,
            borderWidth: 1,
            borderColor: isDarkMode ? Colors.slate[700] : Colors.gray[200],
            borderRadius: 4,
          }}
        >
          {options.map((child, index) => (
            <>
              <TouchableOpacity
                key={index}
                onPress={() => {
                  if (!child.confirmOptions) {
                    child.onPress();
                    setIsOpen(false);
                    return;
                  } else setDialogVisible(true);
                }}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: isDarkMode ? Colors.black : Colors.white,
                  flexDirection: 'row',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                {child.icon && <child.icon size={'xs'} />}
                <Text>{child.label}</Text>
              </TouchableOpacity>
              <Dialog.Container
                useNativeDriver
                visible={dialogVisible}
                blurComponentIOS={blurComponentIOS}
                contentStyle={{
                  borderRadius: 15,
                  backgroundColor: isDarkMode ? Colors.slate[900] : Colors.slate[200],
                }}
              >
                <Dialog.Title>{child.confirmOptions?.title}</Dialog.Title>
                <Dialog.Description>{child.confirmOptions?.body}</Dialog.Description>

                <Dialog.Button
                  label={child.confirmOptions?.buttonText}
                  onPress={() => {
                    setDialogVisible(false);
                    child.onPress();
                    setIsOpen(false);
                  }}
                />
                <Dialog.Button label="Cancel" onPress={() => setDialogVisible(false)} />
              </Dialog.Container>
            </>
          ))}
        </View>
      ) : null}
    </View>
  );
};
