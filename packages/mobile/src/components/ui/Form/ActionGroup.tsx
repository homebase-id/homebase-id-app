import { useState, FC, ReactNode } from 'react';
import { StyleProp, ViewStyle, View, TouchableOpacity } from 'react-native';

import { IconProps } from '../Icons/icons';
import { Colors } from '../../../app/Colors';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { Text } from '../Text/Text';

interface SelectProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  options: {
    label: string;
    onPress: () => void;
    icon?: FC<IconProps>;
  }[];
}

export const ActionGroup = ({ children, style, options }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode } = useDarkMode();

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
            <TouchableOpacity
              key={index}
              onPress={() => {
                setIsOpen(false);
                child.onPress();
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
          ))}
        </View>
      ) : null}
    </View>
  );
};
