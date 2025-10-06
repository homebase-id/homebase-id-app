/**
 * MessageContainer Switch
 *
 * This file dynamically exports either the original FlatList implementation,
 * the @legendapp/list implementation, or the @shopify/flash-list implementation
 * based on configuration.
 */

import React from 'react';
import MessageContainerOriginal from './MessageContainer';
import MessageContainerLegend from './MessageContainerLegend';
import MessageContainerFlash from './MessageContainerFlash';
import { MessageContainerConfig, ListImplementationType } from './MessageContainerConfig';

export interface MessageContainerSwitchProps {
  listType?: ListImplementationType; // Control which list implementation to use
  [key: string]: any; // Allow other props to pass through
}

function MessageContainerSwitch(props: MessageContainerSwitchProps) {
  const { listType, ...otherProps } = props;

  // Use provided listType or fall back to default config
  const implementation = listType || MessageContainerConfig.DEFAULT_LIST_TYPE;

  switch (implementation) {
    case 'flash':
      return <MessageContainerFlash {...otherProps} />;
    case 'legend':
      return <MessageContainerLegend {...otherProps} />;
    case 'legacy':
    default:
      return <MessageContainerOriginal {...otherProps} />;
  }
}

export default MessageContainerSwitch;
export { MessageContainerConfig, type ListImplementationType } from './MessageContainerConfig';
export type { MessageContainerProps } from './types';
