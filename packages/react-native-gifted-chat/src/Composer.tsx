import React, { memo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  ViewStyle,
  View,
  LayoutChangeEvent,
  TextInputProps,
  TextInput,
} from 'react-native';
import { MIN_COMPOSER_HEIGHT, DEFAULT_PLACEHOLDER } from './Constant';
import Color from './Color';
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
  textInputProps?: Partial<TextInputProps>;
  textInputStyle?: TextInputProps['style'];
  textInputAutoFocus?: boolean;
  keyboardAppearance?: TextInputProps['keyboardAppearance'];
  multiline?: boolean;
  disableComposer?: boolean;
  onTextChanged?(text: string): void;
  onInputSizeChanged?(layout: { width: number; height: number }): void;
  containerStyle?: ViewStyle;
  children?: React.ReactNode;
  hasText: boolean | undefined;
}

export const Composer = memo((props: ComposerProps): React.ReactElement => {
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
  } = props;

  const dimensionsRef = useRef<{ width: number; height: number }>(undefined);
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
  // const handleContentSizeChange = ({
  //   nativeEvent: { contentSize },
  // }: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) =>
  //   determineInputSizeChange(contentSize);

  const onInitialLayout = useCallback((event: LayoutChangeEvent) => {
    const { layout: dimensions } = event.nativeEvent;

    determineInputSizeChange(dimensions);
  }, []);

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
      <TextInput
        onLayout={onInitialLayout}
        testID={placeholder}
        accessible
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
        editable={!disableComposer}
        // onContentSizeChange={handleContentSizeChange}
        onChangeText={onTextChanged}
        style={[styles.textInput, textInputStyle]}
        autoFocus={textInputAutoFocus}
        enablesReturnKeyAutomatically
        underlineColorAndroid='transparent'
        keyboardAppearance={keyboardAppearance}
        autoCapitalize='sentences'
        value={value || defaultValue}
        {...textInputProps}
      />
      {props.children}
    </View>
  );
});
