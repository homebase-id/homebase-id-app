import { useContext } from 'react';
import { WebSocketContext } from './WebSocketContext';

export const useWebSocketContext = () => {
  const webSocketContext = useContext(WebSocketContext);
  if (!webSocketContext) throw new Error('WebSocketContext not found');

  return webSocketContext;
};
