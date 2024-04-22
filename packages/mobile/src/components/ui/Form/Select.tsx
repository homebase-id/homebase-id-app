import { ReactElement, useState, useMemo, memo } from 'react';
import { StyleProp, ViewStyle, View, TouchableOpacity, Text, Pressable } from 'react-native';

import { ArrowDown } from '../Icons/icons';
import { Colors } from '../../../app/Colors';
import { useDarkMode } from '../../../hooks/useDarkMode';

interface SelectProps {
  defaultValue: string | undefined;
  children:
    | ReactElement<OptionProps>
    | null
    | Array<Array<ReactElement<OptionProps>> | ReactElement<OptionProps> | null>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onChange?: (value: string) => void;
}

export const Select = memo(({ defaultValue, children, style, onChange }: SelectProps) => {
  const [currentVal, setCurrentVal] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode } = useDarkMode();

  const flatOptions: Array<ReactElement<OptionProps>> = useMemo(
    () =>
      (Array.isArray(children) ? children.flat() : [children]).filter(Boolean) as Array<
        ReactElement<OptionProps>
      >,
    [children]
  );

  const currentLabel = useMemo(() => {
    const selected = flatOptions.find((child) => child.props.value === currentVal);
    return selected?.props.children || 'Make a selection';
  }, [flatOptions, currentVal]);

  return (
    <View style={style}>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={[
          {
            padding: 8,
            borderWidth: 1,
            borderColor: isDarkMode ? Colors.slate[700] : Colors.gray[200],
            borderRadius: 4,
            position: 'relative',
            zIndex: 20,
            elevation: 20,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          },
        ]}
      >
        <Text
          style={{
            color: isDarkMode ? Colors.white : Colors.black,
          }}
        >
          {currentLabel}
        </Text>
        <ArrowDown size={'sm'} />
      </Pressable>

      {isOpen ? (
        <View
          style={{
            position: 'absolute',
            top: '100%',
            minWidth: 180,
            right: 0,
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            zIndex: 20,
            elevation: 20,

            borderWidth: 1,
            borderColor: isDarkMode ? Colors.slate[700] : Colors.gray[200],
            borderRadius: 4,
          }}
        >
          {flatOptions.map((child) => (
            <TouchableOpacity
              key={child?.key}
              onPress={() => {
                setCurrentVal(child?.props.value);
                onChange && child?.props.value && onChange(child?.props.value);
                setIsOpen(false);
              }}
              style={{
                backgroundColor:
                  currentVal === child?.props.value
                    ? isDarkMode
                      ? Colors.slate[700]
                      : Colors.slate[200]
                    : isDarkMode
                      ? Colors.black
                      : Colors.white,
              }}
            >
              {child}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
});

interface OptionProps {
  value?: string;
  children: string;
}
export const Option = ({ children }: OptionProps) => {
  const { isDarkMode } = useDarkMode();
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ color: isDarkMode ? Colors.white : Colors.black }}>{children}</Text>
    </View>
  );
};
