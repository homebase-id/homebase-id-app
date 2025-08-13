import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  LayoutChangeEvent,
  ListRenderItemInfo,
  FlatList,
  CellRendererProps,
  StyleSheet,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes';

import { LoadEarlier } from './LoadEarlier';
import { IMessage } from './Models';
import TypingIndicator from './TypingIndicator';
import Color from './Color';
import Item from './components/Item';
import DayAnimated from './components/DayAnimated';
import { MessageContainerProps, DaysPositions } from './types';

import { isSameDay } from './utils';
import { warning } from './logging';
import { KeyboardGestureArea } from 'react-native-keyboard-controller';

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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

function MessageContainer<TMessage extends IMessage = IMessage>(
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
      if (inverted) scrollTo({ offset: 0, animated });
      else if (forwardRef?.current)
        forwardRef.current.scrollToEnd({ animated });
    },
    [forwardRef, inverted, scrollTo],
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

      if (messages && user) {
        const previousMessage =
          (inverted ? messages[index + 1] : messages[index - 1]) || {};
        const nextMessage =
          (inverted ? messages[index - 1] : messages[index + 1]) || {};

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
    [props, inverted, user, renderDayProp, renderMessageProp],
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

      if (!inverted && messages?.length)
        setTimeout(() => {
          doScrollToBottom(false);
        }, 500);

      listViewProps?.onLayout?.(event);
    },
    [inverted, messages, doScrollToBottom, listHeight, listViewProps],
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
          Object.keys(value).forEach(key => {
            const item = value[key];
            if (
              isSameDay(newValue.createdAt, item.createdAt) &&
              (inverted ? item.y <= newValue.y : item.y >= newValue.y)
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
      const messageIndex = messages.findIndex(m => m._id.toString() === key);
      let shouldRemove = messageIndex === -1;

      if (!shouldRemove) {
        const prevMessage = messages[messageIndex + (inverted ? 1 : -1)];
        const message = messages[messageIndex];
        shouldRemove = !!prevMessage && isSameDay(message, prevMessage);
      }

      if (shouldRemove)
        daysPositions.modify(value => {
          'worklet';

          delete value[key];
          return value;
        });
    });
  }, [messages, daysPositions, inverted]);

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
      <AnimatedFlatList
        extraData={extraData}
        ref={forwardRef as React.Ref<FlatList<unknown>>}
        // @ts-expect-error: Type mismatch with FlatListProps
        keyExtractor={keyExtractor}
        data={messages}
        renderItem={renderItem as any}
        inverted={inverted}
        automaticallyAdjustContentInsets={false}
        style={styles.listStyle}
        {...invertibleScrollViewProps}
        ListEmptyComponent={renderChatEmpty}
        ListFooterComponent={
          inverted ? ListHeaderComponent : ListFooterComponent
        }
        ListHeaderComponent={
          inverted ? ListFooterComponent : ListHeaderComponent
        }
        onScroll={scrollHandler}
        scrollEventThrottle={1}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        onLayout={onLayoutList}
        CellRendererComponent={renderCell}
        {...cleanListViewProps}
      />
      {isScrollToBottomEnabledFinal ? renderScrollToBottomWrapper() : null}
      <DayAnimated
        scrolledY={scrolledY}
        daysPositions={daysPositions}
        listHeight={listHeight}
        renderDay={renderDayProp}
        messages={messages}
        isLoadingEarlier={isLoadingEarlier}
      />
    </KeyboardGestureArea>
  );
}

export default MessageContainer;
