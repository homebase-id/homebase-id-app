import { ComposeChat } from './Icons/icons';
import {
  GestureResponderEvent,
  Platform,
  StyleProp,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  View,
} from 'react-native';
import { HeaderBackButton, HeaderBackButtonProps } from '@react-navigation/elements';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { memo, ReactNode, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { Text } from './Text/Text';

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
      tintColor={isDarkMode ? Colors.white : Colors.black}
    />
  );
};

const Empty = () => {
  return <></>;
};

export const IconButton = memo(
  ({
    icon,
    onPress,
    touchableProps,
    style,
    title,
    textStyle,
  }: {
    icon: ReactNode;
    onPress?: (e: GestureResponderEvent) => void;
    touchableProps?: Omit<TouchableOpacityProps, 'onPress'>;
    style?: StyleProp<ViewStyle>;
    textStyle?: TextStyle;
    title?: string;
  }) => {
    const defaultActions = useCallback(() => {
      Toast.show({
        type: 'info',
        text1: 'No action provided',
        text2: 'Make sure u are passing the props correctly',
      });
    }, []);
    return (
      <View
        style={
          title
            ? {
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }
            : undefined
        }
      >
        <TouchableOpacity
          onPress={onPress || defaultActions}
          style={[{ padding: 10 }, style]}
          {...touchableProps}
        >
          {icon}
        </TouchableOpacity>
        {title && (
          <Text
            style={
              textStyle || {
                fontSize: 12,
                fontWeight: '400',
                textAlign: 'center',
              }
            }
          >
            {title}
          </Text>
        )}
      </View>
    );
  }
);
