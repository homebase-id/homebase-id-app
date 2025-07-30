import { useState } from 'react';
import { IconProps } from './Icons/icons';
import { ActivityIndicator, StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from './Text/Text';

export const ListTile = ({
  icon,
  title,
  onPress,
  showLoader,
  style,
}: {
  icon: (props: IconProps) => JSX.Element;
  title: string;
  onPress: () => void | Promise<void>;
  showLoader?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const [pending, setPending] = useState(false);
  const onClick = async () => {
    if (!showLoader) return onPress();
    setPending(true);
    await onPress();
    setPending(false);
  };
  return (
    <TouchableOpacity
      onPress={() => onClick()}
      style={[
        {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
        },
        style,
      ]}
    >
      {icon({ size: 'lg' })}
      <Text
        style={{
          marginLeft: 16,
        }}
      >
        {title}
      </Text>
      {pending ? <ActivityIndicator style={{ marginLeft: 'auto' }} /> : null}
    </TouchableOpacity>
  );
};
