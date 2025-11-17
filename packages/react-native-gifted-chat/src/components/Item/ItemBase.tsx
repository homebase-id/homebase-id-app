import React, { forwardRef } from 'react';
import { View } from 'react-native';

import { Day } from '../../Day';
import { IMessage, MessageProps } from '../../Models';
import { isSameDay } from '../../utils';
import { ItemProps } from './types';

export const DayWrapper = forwardRef<View, MessageProps<IMessage>>(
  (props, ref) => {
    const { renderDay: renderDayProp, currentMessage, previousMessage } = props;

    if (
      !currentMessage?.createdAt ||
      isSameDay(currentMessage, previousMessage)
    )
      return null;

    const {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      containerStyle,
      onMessageLayout,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...rest
    } = props;

    return (
      <View ref={ref}>
        {renderDayProp ? (
          renderDayProp({ ...rest, createdAt: currentMessage.createdAt })
        ) : (
          <Day {...rest} createdAt={currentMessage.createdAt} />
        )}
      </View>
    );
  },
);

export interface BaseItemProps<TMessage extends IMessage> {
  currentMessage: TMessage;
  previousMessage?: TMessage;
  nextMessage?: TMessage;
  position: 'left' | 'right';
  renderMessage?: (props: MessageProps<TMessage>) => React.ReactElement | null;
}

export const prepareMessageProps = <TMessage extends IMessage>(
  props: ItemProps<TMessage>,
  restProps: Omit<MessageProps<TMessage>, keyof BaseItemProps<TMessage>>,
): MessageProps<TMessage> => {
  return {
    ...restProps,
    currentMessage: props.currentMessage,
    previousMessage: props.previousMessage,
    nextMessage: props.nextMessage,
    position: props.position,
  } as MessageProps<TMessage>;
};
