import React, { memo, useMemo } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';

import { Composer, ComposerProps } from './Composer';
import { Send, SendProps } from './Send';
import { Actions, ActionsProps } from './Actions';
import Color from './Color';
import { IMessage } from './Models';

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Color.defaultColor,
    backgroundColor: Color.white,
    bottom: 0,
    left: 0,
    right: 0,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  accessory: {
    height: 44,
  },
});

export interface InputToolbarProps<TMessage extends IMessage> {
  options?: { [key: string]: any };
  optionTintColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  primaryStyle?: StyleProp<ViewStyle>;
  accessoryStyle?: StyleProp<ViewStyle>;
  renderAccessory?(props: InputToolbarProps<TMessage>): React.ReactNode;
  renderActions?(props: ActionsProps): React.ReactNode;
  renderSend?(props: SendProps<TMessage>): React.ReactNode;
  renderComposer?(props: ComposerProps): React.ReactNode;
  onPressActionButton?(): void;
  text?: string;
}

export const InputToolbar = memo(
  <TMessage extends IMessage = IMessage>(
    props: InputToolbarProps<TMessage>,
  ) => {
    // const [position, setPosition] = useState('absolute');
    // useEffect(() => {
    //   const keyboardWillShowListener = Keyboard.addListener(
    //     'keyboardWillShow',
    //     () => setPosition('relative'),
    //   );
    //   const keyboardWillHideListener = Keyboard.addListener(
    //     'keyboardWillHide',
    //     () => setPosition('absolute'),
    //   );
    //   return () => {
    //     keyboardWillShowListener?.remove();
    //     keyboardWillHideListener?.remove();
    //   };
    // }, []);

    const {
      containerStyle,
      renderActions,
      onPressActionButton,
      renderComposer,
      renderSend,
      renderAccessory,
      text, // We only pass text to Send as only send should re-render when it changes
      ...rest
    } = props;

    const hasText = useMemo(() => !!text, [text]);
    return (
      <View
        style={
          [
            styles.container,
            // { position },
            containerStyle,
          ] as StyleProp<ViewStyle>
        }
      >
        <View style={[styles.primary, props.primaryStyle]}>
          {renderActions?.(rest) ||
            (onPressActionButton && <Actions {...rest} />)}
          {renderComposer?.({
            ...(rest as ComposerProps),
            hasText,
            value: text,
          }) || <Composer {...(rest as ComposerProps)} value={text} />}
          {renderSend?.({ ...props, text }) || <Send {...props} text={text} />}
        </View>
        {renderAccessory && (
          <View style={[styles.accessory, props.accessoryStyle]}>
            {renderAccessory(props)}
          </View>
        )}
      </View>
    );
  },
);
