import React from 'react';

import { useDarkMode } from 'homebase-feed-app';
import { Colors } from '../../../app/Colors';
import { Text, TextProps, TextStyle } from 'react-native';

interface OurTextProps extends Omit<TextProps, 'style'> {
  style?: TextStyle;
}

const OurText = (props: OurTextProps) => {
  const { isDarkMode } = useDarkMode();
  const { style, ...rest } = props;

  return (
    <Text
      style={{ color: isDarkMode ? Colors.white : Colors.black, ...style }}
      {...rest}
    />
  );
};

export { OurText as Text };
