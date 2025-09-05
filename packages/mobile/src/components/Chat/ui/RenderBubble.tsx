import { tryJsonParse } from '@homebase-id/js-lib/helpers';
import { getPlainTextFromRichText } from 'homebase-id-app-common';
import { memo, useCallback } from 'react';
import { Pressable, View, Text } from 'react-native';
import { BubbleProps, IMessage, TimeProps, Time, Bubble } from 'react-native-gifted-chat';
import { uses24HourClock } from 'react-native-localize';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { ChatDeletedArchivalStaus } from '../../../provider/chat/ChatProvider';
import { isEmojiOnly, timesAreEqualWithinTolerance } from '../../../utils/utils';
import { Colors } from '../../../app/Colors';
import { useBubbleContext } from '../../BubbleContext/useBubbleContext';
import { ChatDeliveryIndicator } from '../Chat-Delivery-Indicator';
import { ChatMessageIMessage } from '../ChatDetail';

export const RenderBubble = memo(
  (
    props: {
      onReactionClick: (message: ChatMessageIMessage) => void;
      onRetryClick: (message: ChatMessageIMessage) => void;
    } & Readonly<BubbleProps<IMessage>>
  ) => {
    const { bubbleColor } = useBubbleContext();
    const { isDarkMode } = useDarkMode();

    const message = props.currentMessage as ChatMessageIMessage;
    const content = message?.fileMetadata.appData.content;

    const plainMessage = getPlainTextFromRichText(content.message);
    const onlyEmojis = isEmojiOnly(plainMessage);
    const isReply = !!content?.replyId;
    const showBackground = !onlyEmojis || isReply;

    const onRetryOpen = useCallback(() => {
      props.onRetryClick(message);
    }, [message, props]);

    const reactions =
      (message.fileMetadata.reactionPreview?.reactions &&
        Object.values(message.fileMetadata.reactionPreview?.reactions).map((reaction) => {
          return tryJsonParse<{ emoji: string }>(reaction.reactionContent).emoji;
        })) ||
      [];
    const filteredEmojis = Array.from(new Set(reactions));
    const hasReactions = (reactions && reactions?.length > 0) || false;

    // has pauload and no text but no audio payload
    const hasPayloadandNoText =
      message?.fileMetadata.payloads &&
      message?.fileMetadata.payloads?.length > 0 &&
      !content?.message &&
      !message?.fileMetadata?.payloads?.some(
        (val) => val.contentType.startsWith('audio') || val.contentType.startsWith('application')
      );

    const deleted = message?.fileMetadata.appData.archivalStatus === ChatDeletedArchivalStaus;

    const renderTime = useCallback(
      (timeProp: TimeProps<ChatMessageIMessage>) => {
        const is24Hour = uses24HourClock();
        return (
          <Time
            {...timeProp}
            timeFormat={is24Hour ? 'HH:mm' : 'LT'}
            timeTextStyle={
              !showBackground
                ? {
                    left: {
                      color: isDarkMode ? Colors.white : Colors.black,
                      fontSize: 12,
                    },
                    right: {
                      color: isDarkMode ? Colors.white : Colors.black,
                      fontSize: 12,
                    },
                  }
                : hasPayloadandNoText
                  ? {
                      right: {
                        color: Colors.slate[100],
                        fontSize: 12,
                      },
                      left: {
                        color: Colors.slate[100],
                        fontSize: 12,
                      },
                    }
                  : {
                      right: {
                        fontSize: 12,
                        color: !isDarkMode ? Colors.slate[300] : Colors.slate[200],
                      },
                      left: {
                        fontSize: 12,
                      },
                    }
            }
          />
        );
      },
      [hasPayloadandNoText, isDarkMode, showBackground]
    );

    const isEdited = !timesAreEqualWithinTolerance(
      message?.fileMetadata.created,
      message?.fileMetadata.updated
    );

    return (
      <Bubble
        {...props}
        isEdited={isEdited}
        renderTicks={(message: ChatMessageIMessage) => (
          <ChatDeliveryIndicator msg={message} onPress={onRetryOpen} />
        )}
        renderReactions={
          !hasReactions || deleted
            ? undefined
            : () => {
                const maxVisible = 2;
                const countExcludedFromView = reactions?.length
                  ? reactions?.length - maxVisible
                  : 0;

                return (
                  <Pressable onPress={() => props.onReactionClick(message)}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        padding: 4,
                        borderRadius: 15,
                        backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                      }}
                    >
                      {filteredEmojis?.slice(0, maxVisible).map((reaction, index) => {
                        return (
                          <Text
                            key={index}
                            style={{
                              fontSize: 18,
                              marginRight: 2,
                            }}
                          >
                            {reaction}
                          </Text>
                        );
                      })}
                      {countExcludedFromView > 0 && (
                        <Text
                          style={{
                            color: isDarkMode ? Colors.white : Colors.black,
                            fontSize: 16,
                            fontWeight: '500',
                            marginRight: 2,
                          }}
                        >
                          +{countExcludedFromView}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              }
        }
        renderTime={renderTime}
        tickStyle={{
          color: isDarkMode ? Colors.white : hasPayloadandNoText ? Colors.white : Colors.black,
        }}
        textStyle={
          showBackground
            ? {
                left: { color: isDarkMode ? Colors.white : Colors.black },
                // right: { color: isDarkMode ? Colors.white : Colors.black },
                right: { color: Colors.white },
              }
            : undefined
        }
        wrapperStyle={
          !showBackground
            ? {
                left: {
                  backgroundColor: 'transparent',
                },
                right: {
                  backgroundColor: 'transparent',
                },
              }
            : {
                left: {
                  backgroundColor: isDarkMode ? `${Colors.gray[300]}4D` : `${Colors.gray[500]}1A`,
                  minWidth: hasReactions ? 90 : undefined,
                  justifyContent: 'flex-start',
                },
                right: {
                  backgroundColor: bubbleColor?.color,
                  // backgroundColor: isDarkMode
                  //   ? `${bubbleColor?.color}33`
                  //   : `${bubbleColor?.color}1A`,
                  // backgroundColor: isDarkMode
                  //   ? `${Colors.indigo[500]}33`
                  //   : `${Colors.indigo[500]}1A`,
                  minWidth: hasReactions ? 90 : undefined,
                },
              }
        }
        gradientWrapperStyle={
          !showBackground
            ? undefined
            : {
                right: bubbleColor?.gradient,
              }
        }
        bottomContainerStyle={
          hasPayloadandNoText
            ? {
                right: {
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  zIndex: 10,
                },
                left: {
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  zIndex: 10,
                },
              }
            : undefined
        }
      />
    );
  }
);
