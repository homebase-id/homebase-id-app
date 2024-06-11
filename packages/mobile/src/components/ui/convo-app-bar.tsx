import { ComposeChat } from './Icons/icons';
import { Platform, StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { HeaderBackButton, HeaderBackButtonProps } from '@react-navigation/elements';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';

export const HeaderActions = (props: {
  onPress: () => void;
  tintColor?: string;
  pressColor?: string;
  pressOpacity?: number;
  labelVisible?: boolean;
}) => {
  return (
    <TouchableOpacity style={{}} onPress={props.onPress}>
      <ComposeChat />
    </TouchableOpacity>
  );
};

/// Back Button for Contact Screen
export const BackButton = (props: {
  onPress: () => void;
  prop?: HeaderBackButtonProps;
  label?: string;
  style?: StyleProp<ViewStyle>;
  showArrow?: boolean;
}) => {
  const { isDarkMode } = useDarkMode();
  return (
    <HeaderBackButton
      {...props.prop}
      onPress={props.onPress}
      label={props.label ?? 'Cancel'}
      backImage={props.showArrow ? undefined : Platform.OS === 'ios' ? Empty : undefined}
      labelStyle={[
        {
          color: isDarkMode ? Colors.white : Colors.black,
          fontWeight: '600',
        },
        props.style,
      ]}
    />
  );
};

const Empty = () => {
  return <></>;
};
