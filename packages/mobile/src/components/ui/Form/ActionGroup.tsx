import { useState, FC, ReactNode } from 'react';
import { StyleProp, ViewStyle, View, TouchableOpacity, StyleSheet } from 'react-native';

import { IconProps } from '../Icons/icons';
import { Colors } from '../../../app/Colors';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Text } from '../Text/Text';
import Dialog from 'react-native-dialog';
import { BlurView } from '@react-native-community/blur';
import React from 'react';

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
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={() => setIsOpen((_isOpen) => !_isOpen)}>
        {children}
      </TouchableOpacity>

      {isOpen ? (
        <View
          key={'options'}
          style={[
            styles.menu,
            {
              backgroundColor: isDarkMode ? Colors.black : Colors.white,
              borderColor: isDarkMode ? Colors.slate[700] : Colors.gray[200],
            },
          ]}
        >
          {options.map((child, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                onPress={() => {
                  if (!child.confirmOptions) {
                    child.onPress();
                    setIsOpen(false);
                    return;
                  } else setDialogVisible(true);
                }}
                style={[
                  styles.option,
                  { backgroundColor: isDarkMode ? Colors.black : Colors.white },
                ]}
              >
                {child.icon && <child.icon size={'xs'} />}
                <Text>{child.label}</Text>
              </TouchableOpacity>
              {child.confirmOptions && (
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
              )}
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  menu: {
    position: 'absolute',
    top: 22,
    minWidth: 180,
    left: 0,
    zIndex: 20,
    elevation: 20,
    borderWidth: 1,
    borderRadius: 4,
  },
  option: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
});
