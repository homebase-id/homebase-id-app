import React, { useCallback, useMemo } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import Message from '../../Message';
import { IMessage, MessageProps } from '../../Models';
import { DaysPositions } from '../../types';
import { DayWrapper } from './ItemBase';
import { ItemProps } from './types';

export * from './types';

// y-position of current scroll position relative to the bottom of the day container. (since we have inverted list it is bottom)
export const useAbsoluteScrolledPositionToBottomOfDay = (
  listHeight: { value: number },
  scrolledY: { value: number },
  containerHeight: { value: number },
  dayBottomMargin: number,
  dayTopOffset: number,
) => {
  const absoluteScrolledPositionToBottomOfDay = useDerivedValue(
    () =>
      listHeight.value +
      scrolledY.value -
      containerHeight.value -
      dayBottomMargin -
      dayTopOffset,
    [listHeight, scrolledY, containerHeight, dayBottomMargin, dayTopOffset],
  );

  return absoluteScrolledPositionToBottomOfDay;
};

export const useRelativeScrolledPositionToBottomOfDay = (
  listHeight: { value: number },
  scrolledY: { value: number },
  daysPositions: { value: DaysPositions },
  containerHeight: { value: number },
  dayBottomMargin: number,
  dayTopOffset: number,
  createdAt?: number,
) => {
  const dayMarginTop = useMemo(() => 5, []);

  const absoluteScrolledPositionToBottomOfDay =
    useAbsoluteScrolledPositionToBottomOfDay(
      listHeight,
      scrolledY,
      containerHeight,
      dayBottomMargin,
      dayTopOffset,
    );

  // sorted array of days positions by y
  const daysPositionsArray = useDerivedValue(() => {
    const entries = Object.keys(daysPositions.value).map(
      key => daysPositions.value[key],
    );
    return entries.sort((a, b) => a.y - b.y);
  });

  // find current day position by scrolled position
  const currentDayPosition = useDerivedValue(() => {
    if (createdAt != null) {
      const currentDayPosition = daysPositionsArray.value.find(
        (day: any) => day.createdAt === createdAt,
      );
      if (currentDayPosition) return currentDayPosition;
    }

    return daysPositionsArray.value.find((day: any, index: number) => {
      const dayPosition = day.y + day.height;
      return (
        absoluteScrolledPositionToBottomOfDay.value < dayPosition ||
        index === daysPositionsArray.value.length - 1
      );
    });
  }, [daysPositionsArray, absoluteScrolledPositionToBottomOfDay, createdAt]);

  const relativeScrolledPositionToBottomOfDay = useDerivedValue(() => {
    const scrolledBottomY =
      listHeight.value +
      scrolledY.value -
      ((currentDayPosition.value?.y ?? 0) +
        (currentDayPosition.value?.height ?? 0) +
        dayMarginTop);

    return scrolledBottomY;
  }, [listHeight, scrolledY, currentDayPosition, dayMarginTop]);

  return relativeScrolledPositionToBottomOfDay;
};

const Item = <TMessage extends IMessage>(props: ItemProps<TMessage>) => {
  const {
    renderMessage: renderMessageProp,
    scrolledY,
    daysPositions,
    listHeight,
    ...rest
  } = props;

  const dayContainerHeight = useSharedValue(0);
  const dayTopOffset = useMemo(() => 10, []);
  const dayBottomMargin = useMemo(() => 10, []);

  const createdAt = useMemo(
    () => new Date(props.currentMessage.createdAt).getTime(),
    [props.currentMessage.createdAt],
  );

  const relativeScrolledPositionToBottomOfDay =
    useRelativeScrolledPositionToBottomOfDay(
      listHeight,
      scrolledY,
      daysPositions,
      dayContainerHeight,
      dayBottomMargin,
      dayTopOffset,
      createdAt,
    );

  const handleLayoutDayContainer = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      dayContainerHeight.value = nativeEvent.layout.height;
    },
    [dayContainerHeight],
  );

  const style = useAnimatedStyle(
    () => ({
      opacity: interpolate(
        relativeScrolledPositionToBottomOfDay.value,
        [-dayTopOffset, -0.0001, 0, dayContainerHeight.value + dayTopOffset],
        [0, 0, 1, 1],
        'clamp',
      ),
    }),
    [relativeScrolledPositionToBottomOfDay, dayContainerHeight, dayTopOffset],
  );

  return (
    // do not remove key. it helps to get correct position of the day container
    <View key={props.currentMessage._id.toString()}>
      <Animated.View style={style} onLayout={handleLayoutDayContainer}>
        <DayWrapper {...(rest as MessageProps<TMessage>)} />
      </Animated.View>
      {renderMessageProp ? (
        renderMessageProp(rest as MessageProps<TMessage>)
      ) : (
        <Message {...(rest as MessageProps<TMessage>)} />
      )}
    </View>
  );
};

export default Item;
