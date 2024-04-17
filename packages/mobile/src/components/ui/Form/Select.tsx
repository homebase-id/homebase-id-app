import { ReactElement, useState, useMemo, useEffect } from 'react';
import { StyleProp, ViewStyle, View, TouchableOpacity, Text } from 'react-native';

import { ArrowDown } from '../Icons/icons';
import { Colors } from '../../../app/Colors';

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
export const Select = ({ defaultValue, children, style, onChange }: SelectProps) => {
  // console.log('Select', Array.isArray(children) ? children.flat() : [children]);
  const [currentVal, setCurrentVal] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

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

  useEffect(() => {
    if (currentVal && onChange) {
      onChange(currentVal);
    }
  }, [currentVal]);

  return (
    <View style={style}>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={[
          {
            padding: 8,
            borderWidth: 1,
            borderColor: Colors.gray[200],
            borderRadius: 4,
            position: 'relative',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          },
        ]}
      >
        <Text>{currentLabel}</Text>
        <ArrowDown size={'sm'} />
      </TouchableOpacity>

      {isOpen ? (
        <View
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: Colors.white,
            zIndex: 999999,
          }}
        >
          {flatOptions.map((child) => (
            <TouchableOpacity
              key={child?.key}
              onPress={() => {
                setCurrentVal(child?.props.value);
                setIsOpen(false);
              }}
            >
              {child}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

interface OptionProps {
  value?: string;
  children: string;
}
export const Option = ({ children }: OptionProps) => {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text>{children}</Text>
    </View>
  );
};
