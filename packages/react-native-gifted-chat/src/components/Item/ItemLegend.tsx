import React from 'react';
import { View } from 'react-native';

import Message, { MessageProps } from '../../Message';
import { IMessage } from '../../Models';
import { DayWrapper, prepareMessageProps } from './ItemBase';
import { ItemProps } from './types';

const ItemLegend = <TMessage extends IMessage>(props: ItemProps<TMessage>) => {
  const {
    renderMessage: renderMessageProp,
    scrolledY,
    daysPositions,
    listHeight,
    ...rest
  } = props;

  const messageProps = prepareMessageProps<TMessage>(
    props,
    rest as MessageProps<TMessage>,
  );

  return (
    <View key={props.currentMessage._id.toString()}>
      <DayWrapper {...messageProps} />

      {renderMessageProp ? (
        renderMessageProp(messageProps)
      ) : (
        <Message {...messageProps} />
      )}
    </View>
  );
};

export default ItemLegend;
