import React from 'react';
import {
  Text,
  Clipboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { GiftedChatContext } from './GiftedChatContext';
import { QuickReplies, QuickRepliesProps } from './QuickReplies';
import { MessageText, MessageTextProps } from './MessageText';
import { MessageImage, MessageImageProps } from './MessageImage';
import { MessageVideo } from './MessageVideo';
import { MessageAudio } from './MessageAudio';
import { Time, TimeProps } from './Time';

import Color from './Color';
import { isSameUser, isSameDay } from './utils';
import {
  User,
  IMessage,
  LeftRightStyle,
  Reply,
  Omit,
  MessageVideoProps,
  MessageAudioProps,
} from './Models';

import { getPlainTextFromRichText } from 'homebase-id-app-common';

const styles = {
  left: StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'flex-start',
    },
    wrapper: {
      borderRadius: 15,
      backgroundColor: Color.leftBubbleBackground,
      marginRight: 60,
      minHeight: 20,
      justifyContent: 'flex-end',
    },
    containerToNext: {
      borderBottomLeftRadius: 3,
    },
    containerToPrevious: {
      borderTopLeftRadius: 3,
    },
    bottom: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    reactions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginVertical: 4,
      bottom: -22,
      right: 7,
      zIndex: 20,
      position: 'absolute',
    },
  }),
  right: StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'flex-end',
    },
    wrapper: {
      borderRadius: 15,
      backgroundColor: Color.defaultBlue,
      marginLeft: 60,
      minHeight: 20,
      justifyContent: 'flex-end',
    },
    containerToNext: {
      borderBottomRightRadius: 3,
    },
    containerToPrevious: {
      borderTopRightRadius: 3,
    },
    bottom: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    reactions: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginVertical: 4,
      bottom: -22,
      left: 7,
      zIndex: 20,
      position: 'absolute',
    },
  }),
  content: StyleSheet.create({
    tick: {
      fontSize: 10,
      backgroundColor: Color.backgroundTransparent,
      color: Color.white,
    },
    tickView: {
      flexDirection: 'row',
      marginRight: 10,
    },
    edited: {
      fontSize: 11,
      backgroundColor: Color.backgroundTransparent,
      color: '#aaa',

      marginRight: 7,
      marginBottom: 5,
      textAlign: 'left',
    },
    username: {
      top: 0,
      left: 0,
      fontSize: 12,
      backgroundColor: 'transparent',
      color: '#aaa',
    },
    usernameView: {
      flexDirection: 'row',
      marginHorizontal: 10,
    },
  }),
};

const DEFAULT_OPTION_TITLES = ['Copy Text', 'Cancel'];

export type RenderMessageImageProps<TMessage extends IMessage> = Omit<
  BubbleProps<TMessage>,
  'containerStyle' | 'wrapperStyle'
> &
  MessageImageProps<TMessage>;

export type RenderMessageVideoProps<TMessage extends IMessage> = Omit<
  BubbleProps<TMessage>,
  'containerStyle' | 'wrapperStyle'
> &
  MessageVideoProps<TMessage>;

export type RenderMessageAudioProps<TMessage extends IMessage> = Omit<
  BubbleProps<TMessage>,
  'containerStyle' | 'wrapperStyle'
> &
  MessageAudioProps<TMessage>;

export type RenderMessageTextProps<TMessage extends IMessage> = Omit<
  BubbleProps<TMessage>,
  'containerStyle' | 'wrapperStyle'
> &
  MessageTextProps<TMessage>;

export type BubbleGradient = {
  colors: string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
  angle?: number;
};

export interface BubbleProps<TMessage extends IMessage> {
  user?: User;
  touchableProps?: object;
  renderUsernameOnMessage?: boolean;
  isCustomViewBottom?: boolean;
  inverted?: boolean;
  position: 'left' | 'right';
  currentMessage?: TMessage;
  nextMessage?: TMessage;
  previousMessage?: TMessage;
  optionTitles?: string[];
  containerStyle?: LeftRightStyle<ViewStyle>;
  wrapperStyle?: LeftRightStyle<ViewStyle>;
  textStyle?: LeftRightStyle<TextStyle>;
  bottomContainerStyle?: LeftRightStyle<ViewStyle>;
  tickStyle?: StyleProp<TextStyle>;
  containerToNextStyle?: LeftRightStyle<ViewStyle>;
  containerToPreviousStyle?: LeftRightStyle<ViewStyle>;
  usernameStyle?: TextStyle;
  quickReplyStyle?: StyleProp<ViewStyle>;
  quickReplyTextStyle?: StyleProp<TextStyle>;
  gradientWrapperStyle?: LeftRightStyle<BubbleGradient>;
  editedStyle?: StyleProp<TextStyle>;
  isEdited?: boolean;
  onPress?(context?: any, message?: any): void;
  onLongPress?(
    coords: {
      x: number;
      y: number;
      absoluteX: number;
      absoluteY: number;
    },
    context?: any,
    message?: any,
  ): void;
  onQuickReply?(replies: Reply[]): void;
  renderMessageImage?(
    props: RenderMessageImageProps<TMessage>,
  ): React.ReactNode;
  renderMessageVideo?(
    props: RenderMessageVideoProps<TMessage>,
  ): React.ReactNode;
  renderMessageAudio?(
    props: RenderMessageAudioProps<TMessage>,
  ): React.ReactNode;
  renderMessageText?(props: RenderMessageTextProps<TMessage>): React.ReactNode;
  renderCustomView?(bubbleProps: BubbleProps<TMessage>): React.ReactNode;
  renderTime?(timeProps: TimeProps<TMessage>): React.ReactNode;
  renderTicks?(currentMessage: TMessage): React.ReactNode;
  renderEdited?(currentMessage: TMessage): React.ReactNode;
  renderUsername?(user?: TMessage['user']): React.ReactNode;
  renderQuickReplySend?(): React.ReactNode;
  renderReactions?(): React.ReactNode;
  renderQuickReplies?(
    quickReplies: QuickRepliesProps<TMessage>,
  ): React.ReactNode;
}

export default class Bubble<
  TMessage extends IMessage = IMessage,
> extends React.Component<BubbleProps<TMessage>> {
  static contextType = GiftedChatContext;

  onPress = () => {
    if (this.props.onPress) {
      this.props.onPress(this.context, this.props.currentMessage);
    }
  };

  onLongPress = (e: GestureResponderEvent) => {
    const { currentMessage } = this.props;
    const coords = {
      x: e.nativeEvent.pageX,
      y: e.nativeEvent.pageY,
      absoluteX: e.nativeEvent.locationX,
      absoluteY: e.nativeEvent.locationY,
    };
    if (this.props.onLongPress) {
      this.props.onLongPress(coords, this.context, this.props.currentMessage);
    } else if (currentMessage && currentMessage.text) {
      const { optionTitles } = this.props;
      const options =
        optionTitles && optionTitles.length > 0
          ? optionTitles.slice(0, 2)
          : DEFAULT_OPTION_TITLES;
      const cancelButtonIndex = options.length - 1;
      (this.context as any).actionSheet().showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        (buttonIndex: number) => {
          switch (buttonIndex) {
            case 0:
              Clipboard.setString(
                getPlainTextFromRichText(currentMessage.text),
              );
              break;
            default:
              break;
          }
        },
      );
    }
  };

  styledBubbleToNext() {
    const { currentMessage, nextMessage, position, containerToNextStyle } =
      this.props;
    if (
      currentMessage &&
      nextMessage &&
      position &&
      isSameUser(currentMessage, nextMessage) &&
      isSameDay(currentMessage, nextMessage)
    ) {
      return [
        styles[position].containerToNext,
        containerToNextStyle && containerToNextStyle[position],
      ];
    }
    return null;
  }

  styledBubbleToPrevious() {
    const {
      currentMessage,
      previousMessage,
      position,
      containerToPreviousStyle,
    } = this.props;
    if (
      currentMessage &&
      previousMessage &&
      position &&
      isSameUser(currentMessage, previousMessage) &&
      isSameDay(currentMessage, previousMessage)
    ) {
      return [
        styles[position].containerToPrevious,
        containerToPreviousStyle && containerToPreviousStyle[position],
      ];
    }
    return null;
  }

  renderQuickReplies() {
    const {
      currentMessage,
      onQuickReply,
      nextMessage,
      renderQuickReplySend,
      quickReplyStyle,
      quickReplyTextStyle,
    } = this.props;
    if (currentMessage && currentMessage.quickReplies) {
      const { containerStyle, wrapperStyle, ...quickReplyProps } = this.props;
      if (this.props.renderQuickReplies) {
        return this.props.renderQuickReplies(quickReplyProps);
      }
      return (
        <QuickReplies
          currentMessage={currentMessage}
          onQuickReply={onQuickReply}
          renderQuickReplySend={renderQuickReplySend}
          quickReplyStyle={quickReplyStyle}
          quickReplyTextStyle={quickReplyTextStyle}
          nextMessage={nextMessage}
        />
      );
    }
    return null;
  }

  renderMessageText() {
    if (this.props.currentMessage && this.props.currentMessage.text) {
      const {
        containerStyle,
        wrapperStyle,
        optionTitles,
        ...messageTextProps
      } = this.props;
      if (this.props.renderMessageText) {
        return this.props.renderMessageText(messageTextProps);
      }
      return <MessageText {...messageTextProps} />;
    }
    return null;
  }

  renderMessageImage() {
    if (this.props.currentMessage && this.props.currentMessage.image) {
      const { containerStyle, wrapperStyle, ...messageImageProps } = this.props;
      if (this.props.renderMessageImage) {
        return this.props.renderMessageImage(messageImageProps);
      }
      return <MessageImage {...messageImageProps} />;
    }
    return null;
  }

  renderMessageVideo() {
    if (this.props.currentMessage && this.props.currentMessage.video) {
      const { containerStyle, wrapperStyle, ...messageVideoProps } = this.props;
      if (this.props.renderMessageVideo) {
        return this.props.renderMessageVideo(messageVideoProps);
      }
      return <MessageVideo {...messageVideoProps} />;
    }
    return null;
  }

  renderMessageAudio() {
    if (this.props.currentMessage && this.props.currentMessage.audio) {
      const { containerStyle, wrapperStyle, ...messageAudioProps } = this.props;
      if (this.props.renderMessageAudio) {
        return this.props.renderMessageAudio(messageAudioProps);
      }
      return <MessageAudio {...messageAudioProps} />;
    }
    return null;
  }

  renderTicks() {
    const { currentMessage, renderTicks, user } = this.props;
    if (renderTicks && currentMessage) {
      return renderTicks(currentMessage);
    }
    if (
      currentMessage &&
      user &&
      currentMessage.user &&
      currentMessage.user._id !== user._id
    ) {
      return null;
    }
    if (
      currentMessage &&
      (currentMessage.sent || currentMessage.received || currentMessage.pending)
    ) {
      return (
        <View style={styles.content.tickView}>
          {!!currentMessage.sent && (
            <Text style={[styles.content.tick, this.props.tickStyle]}>✓</Text>
          )}
          {!!currentMessage.received && (
            <Text style={[styles.content.tick, this.props.tickStyle]}>✓</Text>
          )}
          {!!currentMessage.pending && (
            <Text style={[styles.content.tick, this.props.tickStyle]}>🕓</Text>
          )}
        </View>
      );
    }
    return null;
  }

  renderTime() {
    if (this.props.currentMessage && this.props.currentMessage.createdAt) {
      const { containerStyle, wrapperStyle, textStyle, ...timeProps } =
        this.props;
      if (this.props.renderTime) {
        return this.props.renderTime(timeProps);
      }
      return <Time {...timeProps} />;
    }
    return null;
  }

  renderEdited() {
    const { currentMessage, renderEdited } = this.props;
    if (renderEdited && currentMessage) {
      return renderEdited(currentMessage);
    }
    if (currentMessage && this.props.isEdited) {
      return (
        <Text style={[styles.content.edited, this.props.editedStyle]}>
          · Edited
        </Text>
      );
    }
    return null;
  }

  renderUsername() {
    const { currentMessage, user, renderUsername } = this.props;
    if (this.props.renderUsernameOnMessage && currentMessage) {
      if (user && currentMessage.user._id === user._id) {
        return null;
      }
      if (renderUsername) {
        return renderUsername(currentMessage.user);
      }
      return (
        <View style={styles.content.usernameView}>
          <Text
            style={
              [
                styles.content.username,
                this.props.usernameStyle,
              ] as StyleProp<TextStyle>
            }
          >
            ~ {currentMessage.user.name}
          </Text>
        </View>
      );
    }
    return null;
  }

  renderCustomView() {
    if (this.props.renderCustomView) {
      return this.props.renderCustomView(this.props);
    }
    return null;
  }

  renderBubbleContent() {
    return this.props.isCustomViewBottom ? (
      <View>
        {this.renderMessageImage()}
        {this.renderMessageVideo()}
        {this.renderMessageAudio()}
        {this.renderMessageText()}
        {this.renderCustomView()}
      </View>
    ) : (
      <View>
        {this.renderCustomView()}
        {this.renderMessageImage()}
        {this.renderMessageVideo()}
        {this.renderMessageAudio()}
        {this.renderMessageText()}
      </View>
    );
  }
  renderReactions() {
    if (this.props.renderReactions) {
      const child = this.props.renderReactions();
      const { position } = this.props;

      return (
        <View
          style={[
            styles[position].reactions,
            // bottomContainerStyle && bottomContainerStyle[position],
          ]}
        >
          {child}
        </View>
      );
    }
    return null;
  }

  render() {
    const {
      position,
      containerStyle,
      wrapperStyle,
      bottomContainerStyle,
      gradientWrapperStyle,
    } = this.props;
    const renderedReactions = this.renderReactions();
    return (
      <View
        style={[
          styles[position].container,
          containerStyle && containerStyle[position],
          renderedReactions && { paddingBottom: 20 },
        ]}
      >
        {gradientWrapperStyle && gradientWrapperStyle[position] ? (
          <LinearGradient
            colors={(gradientWrapperStyle[position] as BubbleGradient).colors}
            useAngle={true}
            angle={(gradientWrapperStyle[position] as BubbleGradient).angle}
            style={[
              styles[position].wrapper,
              this.styledBubbleToNext(),
              this.styledBubbleToPrevious(),
              wrapperStyle && wrapperStyle[position],
            ]}
          >
            <TouchableWithoutFeedback
              onPress={this.onPress}
              onLongPress={this.onLongPress}
              accessibilityRole='text'
              {...this.props.touchableProps}
            >
              <View>
                {this.renderUsername()}
                {this.renderBubbleContent()}
                <View
                  style={[
                    styles[position].bottom,
                    bottomContainerStyle && bottomContainerStyle[position],
                    renderedReactions && { paddingBottom: 8 },
                  ]}
                >
                  {this.renderTime()}
                  {this.renderEdited()}
                  {this.renderTicks()}
                </View>
                {renderedReactions}
              </View>
            </TouchableWithoutFeedback>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles[position].wrapper,
              this.styledBubbleToNext(),
              this.styledBubbleToPrevious(),
              wrapperStyle && wrapperStyle[position],
            ]}
          >
            <TouchableWithoutFeedback
              onPress={this.onPress}
              onLongPress={this.onLongPress}
              accessibilityRole='text'
              {...this.props.touchableProps}
            >
              <View>
                {this.renderUsername()}
                {this.renderBubbleContent()}
                <View
                  style={[
                    styles[position].bottom,
                    bottomContainerStyle && bottomContainerStyle[position],
                    renderedReactions && { paddingBottom: 8 },
                  ]}
                >
                  {this.renderTime()}
                  {this.renderEdited()}
                  {this.renderTicks()}
                </View>
                {renderedReactions}
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}

        {this.renderQuickReplies()}
      </View>
    );
  }
}
