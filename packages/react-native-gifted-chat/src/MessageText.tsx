import PropTypes from 'prop-types';
import React, { FC } from 'react';
import {
  Linking,
  StyleSheet,
  View,
  TextProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  Text,
  TouchableOpacity,
} from 'react-native';

// @ts-ignore
import ParsedText, { ParseShape } from 'react-native-parsed-text';
import { LeftRightStyle, IMessage } from './Models';
import { StylePropType } from './utils';
import { useChatContext } from './GiftedChatContext';
import { error } from './logging';
import { getPlainTextFromRichText } from 'homebase-id-app-common';
import {
  PayloadDescriptor,
  RichText,
  TargetDrive,
} from '@homebase-id/js-lib/core';
export type { ParseShape };

const WWW_URL_PATTERN = /^www\./i;

const { textStyle } = StyleSheet.create({
  textStyle: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
  },
});

const styles = {
  left: StyleSheet.create({
    container: {},
    text: {
      color: 'black',
      ...textStyle,
    },
    link: {
      color: 'black',
      textDecorationLine: 'underline',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      color: '#a855f7',
    },
  }),
  right: StyleSheet.create({
    container: {},
    text: {
      color: 'white',
      ...textStyle,
    },
    link: {
      color: 'white',
      textDecorationLine: 'underline',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      color: '#d8b4fe',
    },
  }),
};

const DEFAULT_OPTION_TITLES = ['Call', 'Text', 'Cancel'];

export interface MessageTextProps<TMessage extends IMessage> {
  position?: 'left' | 'right';
  optionTitles?: string[];
  currentMessage?: TMessage;
  containerStyle?: LeftRightStyle<ViewStyle>;
  textStyle?: LeftRightStyle<TextStyle>;
  linkStyle?: LeftRightStyle<TextStyle>;
  textProps?: TextProps;
  customTextStyle?: StyleProp<TextStyle>;
  parsePatterns?(linkStyle: StyleProp<TextStyle>): ParseShape[];
  allowExpand?: boolean;
  onExpandPress?(): void;
  isRichText?: boolean;
  renderRichText?: FC<{
    body: string | RichText | undefined;
    odinId?: string;
    options?: {
      imageDrive: TargetDrive;
      defaultFileId: string;
      defaultGlobalTransitId?: string;
      lastModified: number | undefined;
      previewThumbnails?: PayloadDescriptor[];
      query?: string;
    };
    renderElement?: (node: any, children: React.ReactNode) => React.ReactNode;
    parsePatterns?: ParseShape[];
    customTextStyle?: StyleProp<TextStyle>;
  }>;
}

export function MessageText<TMessage extends IMessage = IMessage>({
  currentMessage = {} as TMessage,
  optionTitles = DEFAULT_OPTION_TITLES,
  position = 'left',
  containerStyle,
  textStyle,
  linkStyle: linkStyleProp,
  customTextStyle,
  parsePatterns = _ => [],
  textProps,
  onExpandPress,
  allowExpand,
  isRichText,
  renderRichText: RenderRichText,
}: MessageTextProps<TMessage>) {
  const { actionSheet } = useChatContext();
  const [expanded, setExpanded] = React.useState(false);
  // TODO: React.memo
  // const shouldComponentUpdate = (nextProps: MessageTextProps<TMessage>) => {
  //   return (
  //     !!currentMessage &&
  //     !!nextProps.currentMessage &&
  //     currentMessage.text !== nextProps.currentMessage.text
  //   )
  // }

  const onUrlPress = (url: string) => {
    // When someone sends a message that includes a website address beginning with "www." (omitting the scheme),
    // react-native-parsed-text recognizes it as a valid url, but Linking fails to open due to the missing scheme.
    if (WWW_URL_PATTERN.test(url)) {
      onUrlPress(`https://${url}`);
    } else {
      Linking.openURL(url).catch(e => {
        error(e, 'No handler for URL:', url);
      });
    }
  };

  const onPhonePress = (phone: string) => {
    const options =
      optionTitles && optionTitles.length > 0
        ? optionTitles.slice(0, 3)
        : DEFAULT_OPTION_TITLES;
    const cancelButtonIndex = options.length - 1;
    actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      (buttonIndex: number) => {
        switch (buttonIndex) {
          case 0:
            Linking.openURL(`tel:${phone}`).catch(e => {
              error(e, 'No handler for telephone');
            });
            break;
          case 1:
            Linking.openURL(`sms:${phone}`).catch(e => {
              error(e, 'No handler for text');
            });
            break;
          default:
            break;
        }
      },
    );
  };

  const onEmailPress = (email: string) =>
    Linking.openURL(`mailto:${email}`).catch(e =>
      error(e, 'No handler for mailto'),
    );

  const onInternalExpandPress = () => {
    setExpanded(true);
    onExpandPress?.();
  };

  const linkStyle = [
    styles[position].link,
    linkStyleProp && linkStyleProp[position],
  ] as StyleProp<TextStyle>;
  return (
    <View
      style={[
        styles[position].container,
        containerStyle && containerStyle[position],
      ]}
    >
      {isRichText && RenderRichText ? (
        <RenderRichText
          body={currentMessage.text}
          customTextStyle={[
            styles[position].text,
            textStyle && textStyle[position],
            customTextStyle,
          ]}
          parsePatterns={[
            {
              pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Z|a-z]{2,}\b/,
              style: linkStyle,
              onPress: onEmailPress,
            },
            ...parsePatterns!(linkStyle),
            { type: 'phone', style: linkStyle, onPress: onPhonePress },
          ]}
        />
      ) : (
        <ParsedText
          style={[
            styles[position].text,
            textStyle && textStyle[position],
            customTextStyle,
          ]}
          parse={[
            {
              pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Z|a-z]{2,}\b/,
              style: linkStyle,
              onPress: onEmailPress,
            },
            ...parsePatterns!(linkStyle),
            { type: 'phone', style: linkStyle, onPress: onPhonePress },
          ]}
          childrenProps={{ ...textProps }}
        >
          {getPlainTextFromRichText(currentMessage!.text)}
        </ParsedText>
      )}
      {allowExpand && !expanded && (
        <TextButton
          textStyle={styles[position].button}
          onPress={onInternalExpandPress}
          title={'More'}
        />
      )}
    </View>
  );
}

const TextButton = ({
  onPress,
  title,
  textStyle,
}: {
  onPress: () => void;
  title: string;
  textStyle?: StyleProp<TextStyle>;
}) => {
  return (
    <TouchableOpacity
      style={[
        {
          marginLeft: 10,
          marginRight: 10,
        },
      ]}
      onPress={onPress}
    >
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

MessageText.propTypes = {
  position: PropTypes.oneOf(['left', 'right']),
  optionTitles: PropTypes.arrayOf(PropTypes.string),
  currentMessage: PropTypes.object,
  containerStyle: PropTypes.shape({
    left: StylePropType,
    right: StylePropType,
  }),
  textStyle: PropTypes.shape({
    left: StylePropType,
    right: StylePropType,
  }),
  linkStyle: PropTypes.shape({
    left: StylePropType,
    right: StylePropType,
  }),
  parsePatterns: PropTypes.func,
  textProps: PropTypes.object,
  customTextStyle: StylePropType,
};
