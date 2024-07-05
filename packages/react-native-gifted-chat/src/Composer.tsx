import React, { memo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
  ViewStyle,
  View,
} from 'react-native';
import { MIN_COMPOSER_HEIGHT, DEFAULT_PLACEHOLDER } from './Constant';
import Color from './Color';
import PasteInput, {
  PasteInputProps,
} from '@mattermost/react-native-paste-input';

const styles = StyleSheet.create({
  textInput: {},
  container: {},
});

export interface ComposerProps {
  composerHeight?: number;
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  placeholderTextColor?: string;
  textInputProps?: Partial<PasteInputProps>;
  textInputStyle?: PasteInputProps['style'];
  textInputAutoFocus?: boolean;
  keyboardAppearance?: PasteInputProps['keyboardAppearance'];
  multiline?: boolean;
  disableComposer?: boolean;
  onTextChanged?(text: string): void;
  onInputSizeChanged?(layout: { width: number; height: number }): void;
  containerStyle?: ViewStyle;
  children?: React.ReactNode;
  hasText: boolean | undefined;
  onPaste: PasteInputProps['onPaste'];
}

export const Composer = memo(
  (props: ComposerProps): React.ReactElement => {
    const {
      composerHeight = MIN_COMPOSER_HEIGHT,
      disableComposer = false,
      keyboardAppearance = 'default',
      multiline = true,
      onInputSizeChanged = () => {},
      onTextChanged = () => {},
      placeholder = DEFAULT_PLACEHOLDER,
      placeholderTextColor = Color.defaultColor,
      defaultValue = '',
      value,
      textInputAutoFocus = false,
      textInputProps = {},
      textInputStyle,
      onPaste,
    } = props;

    const dimensionsRef = useRef<{ width: number; height: number }>();
    const determineInputSizeChange = useCallback(
      (dimensions: { width: number; height: number }) => {
        // Support earlier versions of React Native on Android.
        if (!dimensions) {
          return;
        }

        if (
          !dimensionsRef ||
          !dimensionsRef.current ||
          (dimensionsRef.current &&
            (dimensionsRef.current.width !== dimensions.width ||
              dimensionsRef.current.height !== dimensions.height))
        ) {
          dimensionsRef.current = dimensions;
          onInputSizeChanged(dimensions);
        }
      },
      [onInputSizeChanged],
    );
    const handleContentSizeChange = ({
      nativeEvent: { contentSize },
    }: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) =>
      determineInputSizeChange(contentSize);
    console.log('ComposerProps:', value, defaultValue);
    return (
      <View
        style={[
          styles.container,
          {
            minHeight: composerHeight,
          },
          props.containerStyle,
        ]}
      >
        <PasteInput
          testID={placeholder}
          accessible
          accessibilityLabel={placeholder}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          multiline={multiline}
          editable={!disableComposer}
          onPaste={onPaste}
          onContentSizeChange={handleContentSizeChange}
          onChangeText={onTextChanged}
          style={[styles.textInput, textInputStyle]}
          autoFocus={textInputAutoFocus}
          enablesReturnKeyAutomatically
          underlineColorAndroid='transparent'
          keyboardAppearance={keyboardAppearance}
          value={value || defaultValue}
          {...textInputProps}
        />
        {props.children}
      </View>
    );
  },
);
