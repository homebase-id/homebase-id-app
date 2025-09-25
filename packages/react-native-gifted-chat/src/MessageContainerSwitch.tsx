/**
 * MessageContainer Switch
 *
 * This file dynamically exports either the original FlatList implementation
 * or the new @legendapp/list implementation based on configuration.
 */

import React from 'react';
import MessageContainerOriginal from './MessageContainer';
import { MessageContainerConfig } from './MessageContainerConfig';
import MessageContainerLegend from './MessageContainerLegend';

export interface MessageContainerSwitchProps {
  useLegendList?: boolean; // New prop to control which implementation to use
  [key: string]: any; // Allow other props to pass through
}

function MessageContainerSwitch(props: MessageContainerSwitchProps) {
  const { useLegendList, ...otherProps } = props;

  // Use the prop if provided, otherwise fall back to config
  const shouldUseLegendList =
    useLegendList !== undefined
      ? useLegendList
      : MessageContainerConfig.USE_LEGEND_LIST;

  if (shouldUseLegendList) {
    return <MessageContainerLegend {...otherProps} />;
  }

  return <MessageContainerOriginal {...otherProps} />;
}

export default MessageContainerSwitch;
export { MessageContainerConfig } from './MessageContainerConfig';
export type { MessageContainerProps } from './types';
