import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CellRendererProps,
  LayoutChangeEvent,
  ListRenderItemInfo,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes';

import Color from './Color';
import Item from './components/Item';
import { LoadEarlier } from './LoadEarlier';
import { IMessage } from './Models';
import { DaysPositions, MessageContainerProps } from './types';
import TypingIndicator from './TypingIndicator';

import { KeyboardGestureArea } from 'react-native-keyboard-controller';
import DayAnimated from './components/DayAnimated';
import { warning } from './logging';
import { isSameDay } from './utils';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerAlignTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  emptyChatContainer: {
    flex: 1,
    transform: [{ scaleY: -1 }],
  },
  headerWrapper: {
    flex: 1,
  },
  listStyle: {
    flex: 1,
  },
  scrollToBottomStyle: {
    opacity: 0.8,
    position: 'absolute',
    right: 10,
    bottom: 30,
    zIndex: 999,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: Color.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Color.black,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 1,
  },
});

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

function MessageContainerFlash<TMessage extends IMessage = IMessage>(
  props: MessageContainerProps<TMessage>,
) {
  const {
    messages = [],
    user,
    isTyping = false,
    renderChatEmpty: renderChatEmptyProp,
    onLoadEarlier,
    inverted = true,
    loadEarlier = false,
    listViewProps,
    invertibleScrollViewProps,
    extraData = null,
    isScrollToBottomEnabled = false,
    scrollToBottomOffset = 200,
    alignTop = false,
    scrollToBottomStyle,
    infiniteScroll = false,
    isLoadingEarlier = false,
    renderTypingIndicator: renderTypingIndicatorProp,
    renderFooter: renderFooterProp,
    renderLoadEarlier: renderLoadEarlierProp,
    forwardRef,
    handleOnScroll: handleOnScrollProp,
    scrollToBottomComponent: scrollToBottomComponentProp,
    renderDay: renderDayProp,
    renderMessage: renderMessageProp,
    // Legacy prop
    scrollToBottom,
  } = props;

  // Backward compatibility: use scrollToBottom if isScrollToBottomEnabled is not set
  const isScrollToBottomEnabledFinal =
    isScrollToBottomEnabled || scrollToBottom || false;

  // FlashList v2: reverse messages and use maintainVisibleContentPosition
  const reversedMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  const scrollToBottomOpacity = useSharedValue(0);
  const [isScrollToBottomVisible, setIsScrollToBottomVisible] = useState(false);
  const scrollToBottomStyleAnim = useAnimatedStyle(
    () => ({
      opacity: scrollToBottomOpacity.value,
    }),
    [scrollToBottomOpacity],
  );

  const daysPositions = useSharedValue<DaysPositions>({});
  const listHeight = useSharedValue(0);
  const scrolledY = useSharedValue(0);

  const renderTypingIndicator = useCallback(() => {
    if (renderTypingIndicatorProp) return renderTypingIndicatorProp();

    return <TypingIndicator isTyping={isTyping} />;
  }, [isTyping, renderTypingIndicatorProp]);

  const ListFooterComponent = useMemo(() => {
    if (renderFooterProp) return <>{renderFooterProp(props)}</>;

    return <>{renderTypingIndicator()}</>;
  }, [renderFooterProp, renderTypingIndicator, props]);

  const renderLoadEarlier = useCallback(() => {
    if (loadEarlier) {
      if (renderLoadEarlierProp) return renderLoadEarlierProp(props);

      return <LoadEarlier {...props} />;
    }

    return null;
  }, [loadEarlier, renderLoadEarlierProp, props]);

  const scrollTo = useCallback(
    (options: { animated?: boolean; offset: number }) => {
      if (forwardRef?.current && options)
        forwardRef.current.scrollToOffset(options);
    },
    [forwardRef],
  );

  const doScrollToBottom = useCallback(
    (animated: boolean = true) => {
      // With FlashList v2 + reversed data + startRenderingFromBottom,
      // scrolling to bottom means scrolling to the end
      if (forwardRef?.current) {
        forwardRef.current.scrollToEnd({ animated });
      }
    },
    [forwardRef],
  );

  const handleOnScroll = useCallback(
    (event: ReanimatedScrollEvent) => {
      handleOnScrollProp?.(event);

      const {
        contentOffset: { y: contentOffsetY },
        contentSize: { height: contentSizeHeight },
        layoutMeasurement: { height: layoutMeasurementHeight },
      } = event;

      const duration = 250;

      const makeScrollToBottomVisible = () => {
        setIsScrollToBottomVisible(true);
        scrollToBottomOpacity.value = withTiming(1, { duration });
      };

      const makeScrollToBottomHidden = () => {
        scrollToBottomOpacity.value = withTiming(
          0,
          { duration },
          isFinished => {
            if (isFinished) runOnJS(setIsScrollToBottomVisible)(false);
          },
        );
      };

      if (inverted)
        if (contentOffsetY > scrollToBottomOffset!) makeScrollToBottomVisible();
        else makeScrollToBottomHidden();
      else if (
        contentOffsetY < scrollToBottomOffset! &&
        contentSizeHeight - layoutMeasurementHeight > scrollToBottomOffset!
      )
        makeScrollToBottomVisible();
      else makeScrollToBottomHidden();
    },
    [handleOnScrollProp, inverted, scrollToBottomOffset, scrollToBottomOpacity],
  );

  const renderItem = useCallback(
    ({
      item,
      index,
    }: ListRenderItemInfo<unknown>): React.ReactElement | null => {
      const messageItem = item as TMessage;

      if (!messageItem._id && messageItem._id !== 0)
        warning(
          'GiftedChat: `_id` is missing for message',
          JSON.stringify(item),
        );

      if (!messageItem.user) {
        if (!messageItem.system)
          warning(
            'GiftedChat: `user` is missing for message',
            JSON.stringify(messageItem),
          );

        messageItem.user = { _id: 0 };
      }

      const { messages, ...restProps } = props;

      if (reversedMessages && user) {
        // With reversed messages: next item in array is previous message chronologically
        const previousMessage = reversedMessages[index + 1] || {};
        const nextMessage = reversedMessages[index - 1] || {};

        const messageProps = {
          ...restProps,
          currentMessage: messageItem,
          previousMessage,
          nextMessage,
          position: messageItem.user._id === user._id ? 'right' : 'left',
          scrolledY,
          daysPositions,
          listHeight,
        } as const;

        return <Item<TMessage> {...messageProps} />;
      }

      return null;
    },
    [],
  );

  const renderChatEmpty = useCallback(() => {
    if (renderChatEmptyProp)
      return inverted ? (
        renderChatEmptyProp()
      ) : (
        <View style={[styles.container, styles.emptyChatContainer]}>
          {renderChatEmptyProp()}
        </View>
      );

    return <View style={styles.container} />;
  }, [inverted, renderChatEmptyProp]);

  const ListHeaderComponent = useMemo(() => {
    const content = renderLoadEarlier();

    if (!content) return null;

    return <View style={styles.headerWrapper}>{content}</View>;
  }, [renderLoadEarlier]);

  const renderScrollBottomComponent = useCallback(() => {
    if (scrollToBottomComponentProp) return scrollToBottomComponentProp();

    return <Text>{'V'}</Text>;
  }, [scrollToBottomComponentProp]);

  const renderScrollToBottomWrapper = useCallback(() => {
    if (!isScrollToBottomVisible) return null;

    return (
      <TouchableOpacity onPress={() => doScrollToBottom()}>
        <Animated.View
          style={[
            styles.scrollToBottomStyle,
            scrollToBottomStyle,
            scrollToBottomStyleAnim,
          ]}
        >
          {renderScrollBottomComponent()}
        </Animated.View>
      </TouchableOpacity>
    );
  }, [
    scrollToBottomStyle,
    renderScrollBottomComponent,
    doScrollToBottom,
    scrollToBottomStyleAnim,
    isScrollToBottomVisible,
  ]);

  const onLayoutList = useCallback(
    (event: LayoutChangeEvent) => {
      listHeight.value = event.nativeEvent.layout.height;
      listViewProps?.onLayout?.(event);
    },
    [listHeight, listViewProps],
  );

  const onEndReached = useCallback(() => {
    if (
      infiniteScroll &&
      loadEarlier &&
      onLoadEarlier &&
      !isLoadingEarlier &&
      Platform.OS !== 'web'
    )
      onLoadEarlier();
  }, [infiniteScroll, loadEarlier, onLoadEarlier, isLoadingEarlier]);

  const keyExtractor = useCallback((item: unknown, _index: number) => {
    const message = item as TMessage;
    return message._id.toString();
  }, []);

  const renderCell = useCallback(
    (cellProps: CellRendererProps<unknown>) => {
      const handleOnLayout = (event: LayoutChangeEvent) => {
        cellProps.onLayout?.(event);

        if (!cellProps.item) return;

        const { y, height } = event.nativeEvent.layout;

        const newValue = {
          y,
          height,
          createdAt: new Date((cellProps.item as IMessage).createdAt).getTime(),
        };

        daysPositions.modify(value => {
          'worklet';

          const isSameDay = (date1: number, date2: number) => {
            const d1 = new Date(date1);
            const d2 = new Date(date2);

            return (
              d1.getDate() === d2.getDate() &&
              d1.getMonth() === d2.getMonth() &&
              d1.getFullYear() === d2.getFullYear()
            );
          };

          // Use Object.keys and forEach for compatibility
          // FlashList v2 always renders from bottom with startRenderingFromBottom: true
          Object.keys(value).forEach(key => {
            const item = value[key];
            if (
              isSameDay(newValue.createdAt, item.createdAt) &&
              item.y <= newValue.y
            ) {
              delete value[key];
              return;
            }
          });

          // @ts-expect-error: https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue#remarks
          value[(cellProps.item as any)._id] = newValue;
          return value;
        });
      };

      return (
        <View {...cellProps} onLayout={handleOnLayout}>
          {cellProps.children}
        </View>
      );
    },
    [daysPositions, inverted],
  );

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: event => {
        scrolledY.value = event.contentOffset.y;

        runOnJS(handleOnScroll)(event);
      },
    },
    [handleOnScroll],
  );

  // removes unrendered days positions when messages are added/removed
  useEffect(() => {
    Object.keys(daysPositions.value).forEach(key => {
      const messageIndex = reversedMessages.findIndex(
        m => m._id.toString() === key,
      );
      let shouldRemove = messageIndex === -1;

      if (!shouldRemove) {
        const prevMessage = reversedMessages[messageIndex + 1];
        const message = reversedMessages[messageIndex];
        shouldRemove = !!prevMessage && isSameDay(message, prevMessage);
      }

      if (shouldRemove)
        daysPositions.modify(value => {
          'worklet';

          delete value[key];
          return value;
        });
    });
  }, [reversedMessages, daysPositions]);

  // Extract CellRendererComponent from listViewProps to avoid type conflicts
  const { CellRendererComponent, ...cleanListViewProps } = listViewProps || {};

  return (
    <KeyboardGestureArea
      interpolator='ios'
      style={[
        styles.contentContainerStyle,
        alignTop ? styles.containerAlignTop : styles.container,
      ]}
    >
      <AnimatedFlashList
        extraData={extraData}
        ref={forwardRef as React.Ref<FlashList<unknown>>}
        // @ts-expect-error: Type mismatch with FlashListProps
        keyExtractor={keyExtractor}
        data={reversedMessages}
        renderItem={renderItem as any}
        automaticallyAdjustContentInsets={false}
        {...invertibleScrollViewProps}
        ListEmptyComponent={renderChatEmpty}
        ListFooterComponent={ListHeaderComponent}
        ListHeaderComponent={ListFooterComponent}
        maintainVisibleContentPosition={{
          autoscrollToBottomThreshold: 0.2,
          startRenderingFromBottom: true,
        }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onStartReached={onEndReached}
        onStartReachedThreshold={0.1}
        onLayout={onLayoutList}
        drawDistance={1500}
        CellRendererComponent={renderCell}
        {...cleanListViewProps}
      />
      {isScrollToBottomEnabledFinal ? renderScrollToBottomWrapper() : null}
      <DayAnimated
        scrolledY={scrolledY}
        daysPositions={daysPositions}
        listHeight={listHeight}
        messages={messages}
        isLoadingEarlier={isLoadingEarlier}
      />
    </KeyboardGestureArea>
  );
}

export default MessageContainerFlash;
