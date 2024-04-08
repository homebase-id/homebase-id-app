import React, { memo, useCallback, useRef } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import { MIN_COMPOSER_HEIGHT, DEFAULT_PLACEHOLDER } from './Constant';
import Color from './Color';

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    lineHeight: 16,
    ...Platform.select({
      web: {
        paddingTop: 6,
        paddingLeft: 4,
      },
    }),
    marginTop: Platform.select({
      ios: 6,
      android: 0,
      web: 6,
    }),
    marginBottom: Platform.select({
      ios: 5,
      android: 3,
      web: 4,
    }),
  },
});

export interface ComposerProps {
  composerHeight?: number;
  text?: string;
  placeholder?: string;
  placeholderTextColor?: string;
  textInputProps?: Partial<TextInputProps>;
  textInputStyle?: TextInputProps['style'];
  textInputAutoFocus?: boolean;
  keyboardAppearance?: TextInputProps['keyboardAppearance'];
  multiline?: boolean;
  disableComposer?: boolean;
  onTextChanged?(text: string): void;
  onInputSizeChanged?(layout: { width: number; height: number }): void;
}

export const Composer = memo(
  ({
    composerHeight = MIN_COMPOSER_HEIGHT,
    disableComposer = false,
    keyboardAppearance = 'default',
    multiline = true,
    onInputSizeChanged = () => {},
    onTextChanged = () => {},
    placeholder = DEFAULT_PLACEHOLDER,
    placeholderTextColor = Color.defaultColor,
    text = '',
    textInputAutoFocus = false,
    textInputProps = {},
    textInputStyle,
  }: ComposerProps): React.ReactElement => {
    console.log('composer');
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

    return (
      <TextInput
        testID={placeholder}
        accessible
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
        editable={!disableComposer}
        onContentSizeChange={handleContentSizeChange}
        onChangeText={onTextChanged}
        style={[
          styles.textInput,
          textInputStyle,
          {
            height: composerHeight,
            ...Platform.select({
              web: {
                outlineWidth: 0,
                outlineColor: 'transparent',
                outlineOffset: 0,
              },
            }),
          },
        ]}
        autoFocus={textInputAutoFocus}
        value={text}
        enablesReturnKeyAutomatically
        underlineColorAndroid='transparent'
        keyboardAppearance={keyboardAppearance}
        {...textInputProps}
      />
    );
  },
);
